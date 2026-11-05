import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import type { Timestamp as ClientTimestamp } from "firebase/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { tryIssueCertificate } from "@/lib/lms-certificates";
import { COLLECTIONS, type CourseDoc, type EnrollmentDoc, type OrderDoc, type TeamMemberDoc } from "@/lib/schema";

const createSchema = z.object({
  studentId: z.string().min(1).max(160),
  courseId: z.string().min(1).max(160),
});

const statusSchema = z.object({
  enrollmentId: z.string().min(1).max(160),
  status: z.enum(["active", "completed", "expired", "cancelled"]),
});

function requireStaff(actor: { role: string }) {
  if (actor.role !== "admin" && actor.role !== "instructor") {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }
  return null;
}

/**
 * POST /api/lms/enrollments — staff manual enrollment (comped/ACH seats).
 * Validates the student has a linked Academy account, blocks duplicates, and
 * writes a zero-dollar manual order record for the audit trail.
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    const denied = requireStaff(actor);
    if (denied) return denied;
    if (!adminDb) return NextResponse.json({ error: "Enrollment service unavailable" }, { status: 503 });
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "studentId and courseId are required" }, { status: 400 });
    const { studentId, courseId } = parsed.data;

    const [memberSnap, courseSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(studentId).get(),
      adminDb.collection(COLLECTIONS.COURSES).doc(courseId).get(),
    ]);
    if (!memberSnap.exists) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    if (!courseSnap.exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    const member = memberSnap.data() as TeamMemberDoc;
    const course = { id: courseSnap.id, ...courseSnap.data() } as CourseDoc;
    if (!member.firebaseUid) {
      return NextResponse.json({ error: "This student profile is not linked to a signed-in Academy account — the enrollment would be invisible to them" }, { status: 409 });
    }

    const existing = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
      .where("firebaseUid", "==", member.firebaseUid)
      .where("courseId", "==", course.id)
      .where("status", "in", ["active", "completed"])
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json({ error: "This student is already enrolled in the course" }, { status: 409 });
    }

    const now = Timestamp.now();
    const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc();
    const enrollmentRef = adminDb.collection(COLLECTIONS.ENROLLMENTS).doc();
    const order: Omit<OrderDoc, "id"> = {
      firebaseUid: member.firebaseUid,
      studentId,
      courseId: course.id,
      purchaseKind: "manual",
      items: [{ courseId: course.id, code: course.code, title: course.title, unitAmountCents: 0, quantity: 1 }],
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      totalCents: 0,
      currency: course.currency || "usd",
      status: "paid",
      fulfillmentStatus: "fulfilled",
      paymentMethod: "manual",
      createdAt: now as unknown as OrderDoc["createdAt"],
      paidAt: now as unknown as ClientTimestamp,
    };
    const batch = adminDb.batch();
    batch.set(orderRef, order);
    batch.set(enrollmentRef, {
      studentId,
      firebaseUid: member.firebaseUid,
      courseId: course.id,
      status: "active",
      progressPercent: 0,
      enrolledAt: now as unknown as ClientTimestamp,
      paymentId: orderRef.id,
      orderId: orderRef.id,
    } satisfies Omit<EnrollmentDoc, "id">);
    batch.set(adminDb.collection(COLLECTIONS.AUDIT_LOGS).doc(), {
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "enrollment.manual_created",
      entityType: "enrollment",
      entityId: enrollmentRef.id,
      metadata: { studentId, courseId: course.id, orderId: orderRef.id },
      createdAt: now,
    });
    await batch.commit();
    return NextResponse.json({ data: { enrollmentId: enrollmentRef.id, orderId: orderRef.id } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}

/**
 * PATCH /api/lms/enrollments — staff enrollment status changes with the
 * required side effects: completion sets progress/completedAt and triggers
 * certificate issuance; reactivation clears the completed marker.
 */
export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    const denied = requireStaff(actor);
    if (denied) return denied;
    if (!adminDb) return NextResponse.json({ error: "Enrollment service unavailable" }, { status: 503 });
    const parsed = statusSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "enrollmentId and status are required" }, { status: 400 });
    const { enrollmentId, status } = parsed.data;

    const enrollmentRef = adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    const enrollment = { id: enrollmentSnap.id, ...enrollmentSnap.data() } as EnrollmentDoc;

    const now = Timestamp.now();
    const update: Record<string, unknown> = { status, updatedAt: now };
    if (status === "completed") {
      update.progressPercent = 100;
      update.completedAt = enrollment.completedAt || now;
    } else if (enrollment.status === "completed" && status === "active") {
      update.progressPercent = enrollment.progressPercent >= 100 ? 0 : enrollment.progressPercent;
      update.completedAt = null;
    }
    await enrollmentRef.update(update);

    let certificateIssued = false;
    if (status === "completed") {
      try {
        const issued = await tryIssueCertificate(enrollmentId, actor.uid, actor.email);
        certificateIssued = issued.status === "issued" || issued.status === "existing";
      } catch (error) {
        console.error("[enrollments] certificate issuance on manual completion failed:", error);
      }
    }
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "enrollment.status_changed",
      entityType: "enrollment",
      entityId: enrollmentId,
      metadata: { previousStatus: enrollment.status, status, certificateIssued },
      createdAt: now,
    });
    return NextResponse.json({ data: { enrollmentId, status, certificateIssued } });
  } catch (error) {
    return lmsApiError(error);
  }
}

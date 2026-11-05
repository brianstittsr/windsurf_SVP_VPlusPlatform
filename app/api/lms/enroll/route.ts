import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import type { Timestamp as ClientTimestamp } from "firebase/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type CourseDoc, type OrderDoc } from "@/lib/schema";

const bodySchema = z.object({
  courseId: z.string().min(1).max(160),
});

/**
 * POST /api/lms/enroll  { courseId }
 * Enrolls the signed-in student directly into a free (priceCents === 0) course.
 * Paid courses must go through /api/stripe/checkout; registration-mode courses
 * require the staff-reviewed registration flow.
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Enrollment service unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    const courseId = parsed.data.courseId;

    const courseSnap = await adminDb.collection(COLLECTIONS.COURSES).doc(courseId).get();
    if (!courseSnap.exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    const course = courseSnap.data() as CourseDoc;
    if (course.published !== true || course.archived === true) {
      return NextResponse.json({ error: "This course is not available for enrollment" }, { status: 409 });
    }
    if (course.purchaseMode === "registration") {
      return NextResponse.json({ error: "This program requires a staff-reviewed registration" }, { status: 409 });
    }
    if (!Number.isInteger(course.priceCents) || course.priceCents > 0) {
      return NextResponse.json({ error: "This course requires checkout payment" }, { status: 409 });
    }

    const existing = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
      .where("firebaseUid", "==", actor.uid)
      .where("courseId", "==", course.id)
      .where("status", "in", ["active", "completed"])
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json({ data: { enrollmentId: existing.docs[0].id, alreadyEnrolled: true } });
    }

    const now = Timestamp.now();
    const typedNow = now as unknown as ClientTimestamp;
    const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(`free_${actor.studentId}_${course.id}`);
    const enrollmentRef = adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(`free_${actor.studentId}_${course.id}`);
    const order: Omit<OrderDoc, "id"> = {
      firebaseUid: actor.uid,
      studentId: actor.studentId,
      courseId: course.id,
      purchaseKind: "free",
      items: [{
        courseId: course.id,
        code: course.code,
        title: course.title,
        unitAmountCents: 0,
        quantity: 1,
        includedCourseIds: course.includedCourseIds,
      }],
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      totalCents: 0,
      currency: course.currency || "usd",
      status: "paid",
      fulfillmentStatus: "fulfilled",
      paymentMethod: "free",
      createdAt: now as unknown as OrderDoc["createdAt"],
      paidAt: typedNow,
    };
    await orderRef.set(order, { merge: true });
    await enrollmentRef.set({
      studentId: actor.studentId,
      firebaseUid: actor.uid,
      courseId: course.id,
      status: "active",
      progressPercent: 0,
      enrolledAt: now,
      orderId: orderRef.id,
      paymentId: orderRef.id,
    }, { merge: true });
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "enrollment.free_enrollment",
      entityType: "enrollment",
      entityId: enrollmentRef.id,
      metadata: { courseId: course.id, orderId: orderRef.id },
      createdAt: now,
    });
    return NextResponse.json({ data: { enrollmentId: enrollmentRef.id } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}

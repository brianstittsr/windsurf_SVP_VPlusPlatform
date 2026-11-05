import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, LmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { reconcileEnrollmentCompletion } from "@/lib/lms-completion";
import { COLLECTIONS, type EnrollmentDoc } from "@/lib/schema";

const bodySchema = z.object({
  enrollmentId: z.string().min(1).max(160),
  moduleId: z.string().min(1).max(160),
  timeSpentSeconds: z.number().int().min(0).max(60 * 60 * 12).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Progress service unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid lesson completion request" }, { status: 400 });
    const { enrollmentId, moduleId, timeSpentSeconds = 0 } = parsed.data;
    const enrollmentSnap = await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(enrollmentId).get();
    if (!enrollmentSnap.exists) throw new LmsApiError(404, "Enrollment not found");
    const enrollment = { id: enrollmentSnap.id, ...enrollmentSnap.data() } as EnrollmentDoc;
    if (actor.role === "student" && enrollment.firebaseUid !== actor.uid) throw new LmsApiError(403, "Access denied");
    if (enrollment.status !== "active" && enrollment.status !== "completed") throw new LmsApiError(409, "Enrollment is not active");
    const moduleRef = adminDb.collection(COLLECTIONS.COURSE_MODULES).doc(moduleId);
    const moduleSnap = await moduleRef.get();
    if (!moduleSnap.exists || moduleSnap.get("courseId") !== enrollment.courseId) throw new LmsApiError(404, "Course lesson not found");
    const now = Timestamp.now();
    await adminDb.collection(COLLECTIONS.LESSON_PROGRESS).doc(`${enrollment.id}_${moduleId}`).set({
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      studentId: enrollment.studentId,
      firebaseUid: enrollment.firebaseUid,
      moduleId,
      status: "completed",
      timeSpentSeconds,
      updatedAt: now,
    }, { merge: true });
    const progress = await reconcileEnrollmentCompletion(enrollment.id);
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "lesson.completed",
      entityType: "course_module",
      entityId: moduleId,
      metadata: { enrollmentId, courseId: enrollment.courseId, progressPercent: progress.progressPercent },
      createdAt: now,
    });
    return NextResponse.json({ data: progress });
  } catch (error) {
    return lmsApiError(error);
  }
}

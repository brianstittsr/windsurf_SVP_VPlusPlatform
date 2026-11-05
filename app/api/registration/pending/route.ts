import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type RegistrationSubmissionDoc } from "@/lib/schema";

/**
 * GET /api/registration/pending
 * Returns the signed-in student's registrations that are awaiting payment
 * (checkout_pending) so the portal can offer a "resume payment" path.
 */
export async function GET(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Registration service unavailable" }, { status: 503 });
    const snapshot = await adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS)
      .where("userId", "==", actor.studentId)
      .where("status", "==", "checkout_pending")
      .get();
    const pending = snapshot.docs.map((doc) => {
      const submission = doc.data() as RegistrationSubmissionDoc;
      return {
        id: doc.id,
        fullName: submission.fullName,
        courses: submission.selectedCoursesSnapshot.map((course) => ({
          courseId: course.courseId,
          code: course.code,
          title: course.title,
          priceCents: course.priceCents,
        })),
        totalCents: submission.totalCents,
        currency: submission.currency,
        submittedAt: submission.submittedAt?.toDate?.().toISOString?.() || null,
      };
    });
    return NextResponse.json({ data: pending });
  } catch (error) {
    return lmsApiError(error);
  }
}

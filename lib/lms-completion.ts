import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { tryIssueCertificate } from "@/lib/lms-certificates";
import { COLLECTIONS, type CourseDoc, type EnrollmentDoc } from "@/lib/schema";

export interface EnrollmentCompletionResult {
  progressPercent: number;
  completed: boolean;
}

/** Recompute progress and completion from LMS-owned module/runtime/assessment records. */
export async function reconcileEnrollmentCompletion(enrollmentId: string): Promise<EnrollmentCompletionResult> {
  if (!adminDb) throw new Error("Learning records are unavailable");
  const enrollmentSnap = await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(enrollmentId).get();
  if (!enrollmentSnap.exists) throw new Error("Enrollment not found");
  const enrollment = { id: enrollmentSnap.id, ...enrollmentSnap.data() } as EnrollmentDoc;
  const courseSnap = await adminDb.collection(COLLECTIONS.COURSES).doc(enrollment.courseId).get();
  if (!courseSnap.exists) throw new Error("Course not found");
  const course = courseSnap.data() as CourseDoc;

  const [moduleSnap, progressSnap, examBankSnap, runtimeSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.COURSE_MODULES).where("courseId", "==", course.id).get(),
    adminDb.collection(COLLECTIONS.LESSON_PROGRESS).where("enrollmentId", "==", enrollment.id).get(),
    adminDb.collection(COLLECTIONS.QUESTION_BANKS).where("courseId", "==", course.id).where("type", "==", "exam").get(),
    course.format === "scorm"
      ? adminDb.collection(COLLECTIONS.SCORM_RUNTIME).where("enrollmentId", "==", enrollment.id).limit(1).get()
      : Promise.resolve(null),
  ]);

  const moduleIds = moduleSnap.docs.map((module) => module.id);
  const completedIds = new Set(progressSnap.docs.filter((progress) => progress.get("status") === "completed").map((progress) => progress.get("moduleId") as string));
  const modulesComplete = moduleIds.length > 0 && moduleIds.every((id) => completedIds.has(id));
  const runtimeStatus = runtimeSnap && !runtimeSnap.empty ? String(runtimeSnap.docs[0].get("lessonStatus") || "").toLowerCase() : "";
  const scormComplete = course.format === "scorm" && ["completed", "passed"].includes(runtimeStatus);
  const moduleProgress = moduleIds.length ? Math.round((moduleIds.filter((id) => completedIds.has(id)).length / moduleIds.length) * 100) : (scormComplete ? 100 : 0);

  let passedExam = examBankSnap.empty;
  if (!examBankSnap.empty) {
    const examIds = new Set(examBankSnap.docs.map((exam) => exam.id));
    const attempts = await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS)
      .where("enrollmentId", "==", enrollment.id)
      .where("passed", "==", true)
      .get();
    passedExam = attempts.docs.some((attempt) => examIds.has(String(attempt.get("quizId"))));
  }
  const hasCompletionSignal = moduleIds.length > 0 || scormComplete || !examBankSnap.empty;
  const completed = scormComplete || (hasCompletionSignal && (moduleIds.length > 0 ? modulesComplete : passedExam) && passedExam);
  const percent = completed ? 100 : moduleProgress;
  const now = Timestamp.now();
  await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(enrollment.id).update({
    progressPercent: percent,
    lastAccessedAt: now,
    ...(completed ? { status: "completed", completedAt: enrollment.completedAt || now } : {}),
    updatedAt: now,
  });
  if (completed) {
    try {
      await tryIssueCertificate(enrollment.id, enrollment.firebaseUid);
    } catch (error) {
      console.error("[completion] automatic certificate issuance failed:", error);
    }
  }
  return { progressPercent: percent, completed };
}

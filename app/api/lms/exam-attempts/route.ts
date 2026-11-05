import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import type { Timestamp as ClientTimestamp } from "firebase/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { reconcileEnrollmentCompletion } from "@/lib/lms-completion";
import { COLLECTIONS, type CourseDoc, type EnrollmentDoc, type ExamAttemptDoc, type LessonProgressDoc, type QuestionBankDoc } from "@/lib/schema";

const requestSchema = z.object({
  enrollmentId: z.string().min(1).max(160),
  quizId: z.string().min(1).max(160),
  startedAt: z.string().datetime().optional(),
  answers: z.array(z.object({ questionId: z.string().min(1), selectedAnswer: z.string().max(2000) })).min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Assessment service unavailable" }, { status: 503 });
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid answers" }, { status: 400 });
    const input = parsed.data;
    const enrollmentSnap = await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(input.enrollmentId).get();
    if (!enrollmentSnap.exists) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    const enrollment = { id: enrollmentSnap.id, ...enrollmentSnap.data() } as EnrollmentDoc;
    if (actor.role === "student" && enrollment.firebaseUid !== actor.uid) return NextResponse.json({ error: "Access denied" }, { status: 403 });
    if (enrollment.status !== "active" && enrollment.status !== "completed") {
      return NextResponse.json({ error: "This enrollment does not have learning access" }, { status: 409 });
    }

    const [courseSnap, bankSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.COURSES).doc(enrollment.courseId).get(),
      adminDb.collection(COLLECTIONS.QUESTION_BANKS).doc(input.quizId).get(),
    ]);
    if (!courseSnap.exists || !bankSnap.exists) return NextResponse.json({ error: "Course assessment not found" }, { status: 404 });
    const course = courseSnap.data() as CourseDoc;
    const bank = bankSnap.data() as QuestionBankDoc;
    if (bank.courseId !== course.id) return NextResponse.json({ error: "Assessment does not belong to this course" }, { status: 403 });

    // Course-level assessments (final exams) are gated until every lesson
    // module in the course is complete. Lesson-attached quizzes are not gated.
    if (!bank.moduleId) {
      const [modulesSnap, progressSnap] = await Promise.all([
        adminDb.collection(COLLECTIONS.COURSE_MODULES).where("courseId", "==", course.id).get(),
        adminDb.collection(COLLECTIONS.LESSON_PROGRESS).where("enrollmentId", "==", enrollment.id).get(),
      ]);
      const moduleIds = modulesSnap.docs.map((doc) => doc.id);
      const completedModuleIds = new Set(
        progressSnap.docs
          .map((doc) => doc.data() as LessonProgressDoc)
          .filter((progress) => progress.status === "completed")
          .map((progress) => progress.moduleId)
      );
      const incomplete = moduleIds.filter((moduleId) => !completedModuleIds.has(moduleId));
      if (moduleIds.length > 0 && incomplete.length > 0) {
        return NextResponse.json(
          { error: `Complete all ${moduleIds.length} lessons before taking the final exam (${incomplete.length} remaining)` },
          { status: 409 }
        );
      }
    }

    const questionMap = new Map((bank.questions || []).map((question) => [question.id, question]));
    const questionIds = input.answers.map((answer) => answer.questionId);
    if (new Set(questionIds).size !== questionIds.length) return NextResponse.json({ error: "Duplicate question answers are not allowed" }, { status: 400 });
    if (input.answers.some((answer) => !questionMap.has(answer.questionId))) return NextResponse.json({ error: "The quiz contains an unknown question" }, { status: 400 });
    const expectedCount = bank.questionsPerAttempt && bank.questionsPerAttempt < bank.questions.length ? bank.questionsPerAttempt : bank.questions.length;
    if (questionIds.length !== expectedCount) return NextResponse.json({ error: "The submitted question count does not match the quiz" }, { status: 400 });

    const previous = await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS)
      .where("enrollmentId", "==", enrollment.id)
      .where("quizId", "==", bankSnap.id)
      .get();
    const maxAttempts = course.maxAttempts || 3;
    if (previous.size >= maxAttempts) return NextResponse.json({ error: "You have used all allowed attempts" }, { status: 409 });

    const answers = input.answers.map((submitted) => {
      const question = questionMap.get(submitted.questionId)!;
      const selectedIndex = question.options.indexOf(submitted.selectedAnswer);
      return { questionId: question.id, selectedIndex, correct: selectedIndex === question.correctIndex };
    });
    const scorePercent = Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100);
    const passed = scorePercent >= (course.passingScore || 80);
    const now = Timestamp.now();
    const startedAt = input.startedAt ? Timestamp.fromDate(new Date(input.startedAt)) : now;
    const attempt: Omit<ExamAttemptDoc, "id"> = {
      enrollmentId: enrollment.id,
      courseId: course.id,
      studentId: enrollment.studentId,
      firebaseUid: enrollment.firebaseUid,
      quizId: bankSnap.id,
      attemptNumber: previous.size + 1,
      scorePercent,
      passed,
      answers,
      startedAt: startedAt as unknown as ClientTimestamp,
      submittedAt: now as unknown as ClientTimestamp,
    };
    const attemptRef = await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS).add(attempt);
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "assessment.attempt_submitted",
      entityType: "assessment",
      entityId: attemptRef.id,
      metadata: { courseId: course.id, quizId: bankSnap.id, scorePercent, passed },
      createdAt: now,
    });
    let completion: { progressPercent: number; completed: boolean } | null = null;
    if (passed) {
      try {
        completion = await reconcileEnrollmentCompletion(enrollment.id);
      } catch (error) {
        console.error("[exam-attempt] completion reconciliation failed:", error);
      }
    }
    // Post-grading review: correctness and explanations are only revealed after
    // submission. The correct option text is never returned so retakes stay fair.
    const review = answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      return {
        questionId: answer.questionId,
        correct: answer.correct,
        explanation: question?.explanation || "",
      };
    });
    return NextResponse.json({ data: { attemptId: attemptRef.id, attemptNumber: previous.size + 1, scorePercent, passed, review, completion } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}

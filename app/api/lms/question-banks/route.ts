import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type QuestionBankDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Assessments unavailable" }, { status: 503 });
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    if (actor.role === "student") {
      const enrollment = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
        .where("firebaseUid", "==", actor.uid)
        .where("courseId", "==", courseId)
        .where("status", "in", ["active", "completed"])
        .limit(1)
        .get();
      if (enrollment.empty) return NextResponse.json({ error: "Course enrollment required" }, { status: 403 });
    }
    const snapshot = await adminDb.collection(COLLECTIONS.QUESTION_BANKS).where("courseId", "==", courseId).get();
    const banks = snapshot.docs.map((doc) => {
      const bank = doc.data() as QuestionBankDoc;
      return {
        id: doc.id,
        courseId: bank.courseId,
        moduleId: bank.moduleId,
        title: bank.title,
        type: bank.type,
        randomize: bank.randomize,
        questionsPerAttempt: bank.questionsPerAttempt,
        questions: (bank.questions || []).map((question) => ({
          id: question.id,
          question: question.question,
          options: question.options,
          // Explanations are withheld from learners until grading; staff keep
          // them for the question-bank editor.
          ...(actor.role === "student" ? {} : { explanation: question.explanation }),
        })),
      };
    });
    return NextResponse.json({ data: banks });
  } catch (error) {
    return lmsApiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { hasProAccessForUid } from "@/lib/pro-access-server";
import { COLLECTIONS, type StudyGuideCategoryDoc, type StudyGuideProgressDoc, type StudyGuideQuestion, type StudyGuideQuizSessionDoc, type StudyGuideVocabDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Study guide unavailable" }, { status: 503 });
    const proActive = await hasProAccessForUid(actor.uid);
    if (actor.role === "student") {
      const guideCourse = await adminDb.collection(COLLECTIONS.COURSES).where("code", "==", "SG107").limit(1).get();
      if (guideCourse.empty) return NextResponse.json({ error: "Study guide is not published" }, { status: 404 });
      const course = guideCourse.docs[0];
      if (course.get("published") !== true || course.get("archived") === true) return NextResponse.json({ error: "Study guide is not published" }, { status: 404 });
      if (!proActive) {
        const enrollment = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
          .where("firebaseUid", "==", actor.uid)
          .where("courseId", "==", course.id)
          .where("status", "in", ["active", "completed"])
          .limit(1)
          .get();
        if (enrollment.empty) return NextResponse.json({ error: "Study guide enrollment required" }, { status: 403 });
      }
    }

    const [categorySnap, questionSnap, vocabSnap, progressSnap, sessionSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.STUDY_GUIDE_CATEGORIES).get(),
      adminDb.collection(COLLECTIONS.STUDY_GUIDE_QUESTIONS).get(),
      adminDb.collection(COLLECTIONS.STUDY_GUIDE_VOCAB).get(),
      adminDb.collection(COLLECTIONS.STUDY_GUIDE_PROGRESS).doc(actor.uid).get(),
      adminDb.collection(COLLECTIONS.STUDY_GUIDE_SESSIONS).where("firebaseUid", "==", actor.uid).limit(100).get(),
    ]);
    const categories = categorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StudyGuideCategoryDoc).sort((a, b) => a.displayOrder - b.displayOrder);
    const questions = questionSnap.docs.map((doc) => {
      const record = doc.data() as StudyGuideQuestion;
      return { id: doc.id, categoryId: record.categoryId, question: record.question, answers: record.answers, explanation: record.explanation };
    });
    const vocabulary = vocabSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StudyGuideVocabDoc);
    const safeQuestionById = new Map(questions.map((question) => [question.id, question]));
    const sessionRecords = sessionSnapshot.docs.map((doc) => ({ id: doc.id, record: doc.data() as StudyGuideQuizSessionDoc }));
    const activeSessions = sessionRecords.filter(({ record }) => record.status === "in_progress")
      .sort((a, b) => b.record.updatedAt.toMillis() - a.record.updatedAt.toMillis())
      .slice(0, 5)
      .map(({ id, record }) => ({
        id,
        categoryId: record.categoryId,
        currentIndex: record.currentIndex,
        score: record.score,
        startedAt: record.startedAt.toDate().toISOString(),
        questions: record.items.map((item) => {
          const question = safeQuestionById.get(item.questionId);
          if (!question) return null;
          return {
            ...question,
            selectedIndex: item.selectedIndex,
            answered: item.answered,
            result: item.answered ? { correct: item.correct, correctIndex: item.correctIndex, explanation: question.explanation } : null,
          };
        }).filter((question) => question !== null),
      }));
    const history = proActive ? sessionRecords.filter(({ record }) => record.status === "completed")
      .sort((a, b) => (b.record.completedAt?.toMillis() || 0) - (a.record.completedAt?.toMillis() || 0))
      .slice(0, 50)
      .map(({ id, record }) => ({ id, categoryId: record.categoryId, questionCount: record.questionCount, score: record.score, completedAt: record.completedAt?.toDate().toISOString() || null })) : [];
    const progress = progressSnap.exists ? progressSnap.data() as StudyGuideProgressDoc : null;
    return NextResponse.json({ data: {
      categories,
      questions,
      vocabulary,
      activeSessions,
      proActive,
      history,
      progress: {
        answered: progress?.answered || 0,
        correct: progress?.correct || 0,
        streak: progress?.streak || 0,
        lastActivityDate: progress?.lastActivityDate || null,
        knownVocab: progress?.knownVocab || [],
        byCategory: progress?.byCategory || {},
      },
    } });
  } catch (error) {
    return lmsApiError(error);
  }
}

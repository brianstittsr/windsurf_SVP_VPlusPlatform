import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, LmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type StudyGuideProgressDoc, type StudyGuideQuestion, type StudyGuideQuizSessionDoc } from "@/lib/schema";

const bodySchema = z.object({ questionId: z.string().min(1).max(100), selectedIndex: z.number().int().min(0).max(20) });

function utcDate(date: Date): string { return date.toISOString().slice(0, 10); }

export async function POST(req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Study guide unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
    const { sessionId } = await ctx.params;
    const sessionRef = adminDb.collection(COLLECTIONS.STUDY_GUIDE_SESSIONS).doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return NextResponse.json({ error: "Practice session not found" }, { status: 404 });
    const session = sessionSnap.data() as StudyGuideQuizSessionDoc;
    if (session.firebaseUid !== actor.uid) throw new LmsApiError(403, "Access denied");
    const itemIndex = session.items.findIndex((item) => item.questionId === parsed.data.questionId);
    if (itemIndex < 0) return NextResponse.json({ error: "Question is not part of this session" }, { status: 400 });
    const questionSnap = await adminDb.collection(COLLECTIONS.STUDY_GUIDE_QUESTIONS).doc(parsed.data.questionId).get();
    if (!questionSnap.exists) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    const question = questionSnap.data() as StudyGuideQuestion;
    if (parsed.data.selectedIndex >= question.answers.length) return NextResponse.json({ error: "Selected answer is out of range" }, { status: 400 });
    const now = Timestamp.now();
    const progressRef = adminDb.collection(COLLECTIONS.STUDY_GUIDE_PROGRESS).doc(actor.uid);
    const result = await adminDb.runTransaction(async (transaction) => {
      const currentSnap = await transaction.get(sessionRef);
      if (!currentSnap.exists) throw new LmsApiError(404, "Practice session not found");
      const current = currentSnap.data() as StudyGuideQuizSessionDoc;
      if (current.firebaseUid !== actor.uid) throw new LmsApiError(403, "Access denied");
      const item = current.items[itemIndex];
      if (item.answered) return { correct: item.correct === true, correctIndex: item.correctIndex, explanation: question.explanation, currentIndex: current.currentIndex, score: current.score };
      if (current.status !== "in_progress" || current.currentIndex !== itemIndex) throw new LmsApiError(409, "Answer the current question before moving on");
      const correct = parsed.data.selectedIndex === item.correctIndex;
      const updatedItems = current.items.map((value, index) => index === itemIndex ? { ...value, selectedIndex: parsed.data.selectedIndex, correct, answered: true, answeredAt: now } : value);
      const progressSnap = await transaction.get(progressRef);
      const previous = progressSnap.exists ? progressSnap.data() as StudyGuideProgressDoc : null;
      const today = utcDate(now.toDate());
      const lastDate = previous?.lastActivityDate || null;
      const yesterday = utcDate(new Date(now.toMillis() - 24 * 60 * 60 * 1000));
      const streak = lastDate === today ? previous?.streak || 0 : lastDate === yesterday ? (previous?.streak || 0) + 1 : 1;
      const byCategory = { ...(previous?.byCategory || {}) };
      const categoryStats = byCategory[item.categoryId] || { answered: 0, correct: 0 };
      byCategory[item.categoryId] = { answered: categoryStats.answered + 1, correct: categoryStats.correct + (correct ? 1 : 0) };
      transaction.update(sessionRef, {
        items: updatedItems,
        score: current.score + (correct ? 1 : 0),
        currentIndex: current.currentIndex + 1,
        updatedAt: now,
      });
      transaction.set(progressRef, {
        firebaseUid: actor.uid,
        studentId: actor.studentId,
        answered: (previous?.answered || 0) + 1,
        correct: (previous?.correct || 0) + (correct ? 1 : 0),
        streak,
        lastActivityDate: today,
        knownVocab: previous?.knownVocab || [],
        byCategory,
        updatedAt: now,
      }, { merge: true });
      return { correct, correctIndex: item.correctIndex, explanation: question.explanation, currentIndex: current.currentIndex + 1, score: current.score + (correct ? 1 : 0) };
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return lmsApiError(error);
  }
}

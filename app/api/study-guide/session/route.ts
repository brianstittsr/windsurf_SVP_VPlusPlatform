import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { hasProAccessForUid } from "@/lib/pro-access-server";
import { COLLECTIONS, type StudyGuideQuestion, type StudyGuideQuizSessionDoc } from "@/lib/schema";

const bodySchema = z.object({
  categoryId: z.string().min(1).max(80),
  length: z.union([z.literal("all"), z.number().int().min(1).max(100)]),
});

function shuffle<T>(items: T[]): T[] {
  const values = [...items];
  for (let index = values.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [values[index], values[target]] = [values[target], values[index]];
  }
  return values;
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Study guide unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid practice session request" }, { status: 400 });

    if (actor.role === "student") {
      const guide = await adminDb.collection(COLLECTIONS.COURSES).where("code", "==", "SG107").limit(1).get();
      if (guide.empty || guide.docs[0].get("published") !== true || guide.docs[0].get("archived") === true) return NextResponse.json({ error: "Study guide is not published" }, { status: 404 });
      const hasPro = await hasProAccessForUid(actor.uid);
      if (!hasPro) {
        const enrollment = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
          .where("firebaseUid", "==", actor.uid)
          .where("courseId", "==", guide.docs[0].id)
          .where("status", "in", ["active", "completed"])
          .limit(1)
          .get();
        if (enrollment.empty) return NextResponse.json({ error: "Study guide enrollment required" }, { status: 403 });
      }
    }

    const category = parsed.data.categoryId;
    const allQuestions = (await adminDb.collection(COLLECTIONS.STUDY_GUIDE_QUESTIONS).get()).docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as StudyGuideQuestion)
      .filter((question) => category === "all" || question.categoryId === category);
    const selected = shuffle(allQuestions).slice(0, parsed.data.length === "all" ? allQuestions.length : parsed.data.length);
    if (!selected.length) return NextResponse.json({ error: "No questions are available for this selection" }, { status: 404 });
    const now = Timestamp.now();
    const sessionRef = adminDb.collection(COLLECTIONS.STUDY_GUIDE_SESSIONS).doc();
    const session: Omit<StudyGuideQuizSessionDoc, "id"> = {
      firebaseUid: actor.uid,
      studentId: actor.studentId,
      categoryId: category,
      questionCount: selected.length,
      currentIndex: 0,
      score: 0,
      status: "in_progress",
      items: selected.map((question) => ({ questionId: question.id, categoryId: question.categoryId, selectedIndex: null, correctIndex: question.correctIndex, correct: null, answered: false })),
      startedAt: now as unknown as StudyGuideQuizSessionDoc["startedAt"],
      updatedAt: now as unknown as StudyGuideQuizSessionDoc["updatedAt"],
    };
    await sessionRef.set(session);
    return NextResponse.json({ data: {
      sessionId: sessionRef.id,
      categoryId: category,
      currentIndex: 0,
      startedAt: now.toDate().toISOString(),
      questions: selected.map(({ id, categoryId, question, answers, explanation }) => ({ id, categoryId, question, answers, explanation })),
    } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}

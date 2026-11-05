import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { hasProAccessForUid } from "@/lib/pro-access-server";
import { COLLECTIONS, type StudyGuideQuestion } from "@/lib/schema";

const bodySchema = z.object({ questionId: z.string().min(1).max(100), selectedIndex: z.number().int().min(0).max(20) });

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Study guide unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
    if (actor.role === "student") {
      const guide = await adminDb.collection(COLLECTIONS.COURSES).where("code", "==", "SG107").limit(1).get();
      if (guide.empty || guide.docs[0].get("published") !== true) return NextResponse.json({ error: "Study guide is not published" }, { status: 404 });
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
    const snap = await adminDb.collection(COLLECTIONS.STUDY_GUIDE_QUESTIONS).doc(parsed.data.questionId).get();
    if (!snap.exists) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    const question = snap.data() as StudyGuideQuestion;
    if (parsed.data.selectedIndex >= question.answers.length) return NextResponse.json({ error: "Selected answer is out of range" }, { status: 400 });
    return NextResponse.json({ data: {
      correct: parsed.data.selectedIndex === question.correctIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    } });
  } catch (error) {
    return lmsApiError(error);
  }
}

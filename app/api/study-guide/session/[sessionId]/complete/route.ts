import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, LmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type StudyGuideQuizSessionDoc } from "@/lib/schema";

export async function POST(req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Study guide unavailable" }, { status: 503 });
    const { sessionId } = await ctx.params;
    const ref = adminDb.collection(COLLECTIONS.STUDY_GUIDE_SESSIONS).doc(sessionId);
    const now = Timestamp.now();
    const result = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new LmsApiError(404, "Practice session not found");
      const session = snap.data() as StudyGuideQuizSessionDoc;
      if (session.firebaseUid !== actor.uid) throw new LmsApiError(403, "Access denied");
      if (session.status === "completed") return { score: session.score, questionCount: session.questionCount };
      if (!session.items.every((item) => item.answered)) throw new LmsApiError(409, "Answer every question before completing the session");
      transaction.update(ref, { status: "completed", completedAt: now, updatedAt: now });
      return { score: session.score, questionCount: session.questionCount };
    });
    return NextResponse.json({ data: { ...result, scorePercent: Math.round((result.score / result.questionCount) * 100) } });
  } catch (error) {
    return lmsApiError(error);
  }
}

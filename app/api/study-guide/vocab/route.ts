import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { hasProAccessForUid } from "@/lib/pro-access-server";
import { COLLECTIONS, type StudyGuideProgressDoc } from "@/lib/schema";

const bodySchema = z.object({ termId: z.string().min(1).max(100), known: z.boolean() });

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Study guide unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid vocabulary update" }, { status: 400 });
    const term = await adminDb.collection(COLLECTIONS.STUDY_GUIDE_VOCAB).doc(parsed.data.termId).get();
    if (!term.exists) return NextResponse.json({ error: "Vocabulary term not found" }, { status: 404 });
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
    const progressRef = adminDb.collection(COLLECTIONS.STUDY_GUIDE_PROGRESS).doc(actor.uid);
    const now = Timestamp.now();
    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(progressRef);
      const previous = snap.exists ? snap.data() as StudyGuideProgressDoc : null;
      const known = new Set(previous?.knownVocab || []);
      if (parsed.data.known) known.add(parsed.data.termId);
      else known.delete(parsed.data.termId);
      transaction.set(progressRef, {
        firebaseUid: actor.uid,
        studentId: actor.studentId,
        answered: previous?.answered || 0,
        correct: previous?.correct || 0,
        streak: previous?.streak || 0,
        lastActivityDate: previous?.lastActivityDate || null,
        byCategory: previous?.byCategory || {},
        knownVocab: [...known],
        updatedAt: now,
      }, { merge: true });
    });
    return NextResponse.json({ data: { termId: parsed.data.termId, known: parsed.data.known } });
  } catch (error) {
    return lmsApiError(error);
  }
}

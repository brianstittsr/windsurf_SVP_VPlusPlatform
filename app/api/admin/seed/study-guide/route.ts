import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireLmsAdmin, lmsApiError } from "@/lib/lms-api-auth";
import { COLLECTIONS } from "@/lib/schema";
import { STUDY_GUIDE_CATEGORIES, STUDY_GUIDE_QUESTIONS, STUDY_GUIDE_SEED_VERSION, STUDY_GUIDE_TERMS } from "@/lib/study-guide-seed-data";

const META_ID = "part107-source";

export async function GET(req: NextRequest) {
  try {
    await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const snap = await adminDb.collection(COLLECTIONS.STUDY_GUIDE_META).doc(META_ID).get();
    return NextResponse.json({ data: { seeded: snap.exists, version: snap.get("version") || null } });
  } catch (error) {
    return lmsApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const metaRef = adminDb.collection(COLLECTIONS.STUDY_GUIDE_META).doc(META_ID);
    const existing = await metaRef.get();
    if (existing.exists && existing.get("version") === STUDY_GUIDE_SEED_VERSION) {
      return NextResponse.json({ data: { created: false, version: STUDY_GUIDE_SEED_VERSION, counts: existing.get("counts") || {} } });
    }
    const batch = adminDb.batch();
    for (const category of STUDY_GUIDE_CATEGORIES) {
      const { id, ...data } = category;
      batch.set(adminDb.collection(COLLECTIONS.STUDY_GUIDE_CATEGORIES).doc(id), data);
    }
    for (const question of STUDY_GUIDE_QUESTIONS) {
      const { id, ...data } = question;
      batch.set(adminDb.collection(COLLECTIONS.STUDY_GUIDE_QUESTIONS).doc(id), data);
    }
    for (const term of STUDY_GUIDE_TERMS) {
      const { id, ...data } = term;
      batch.set(adminDb.collection(COLLECTIONS.STUDY_GUIDE_VOCAB).doc(id), data);
    }
    const counts = { categories: STUDY_GUIDE_CATEGORIES.length, questions: STUDY_GUIDE_QUESTIONS.length, vocabularyTerms: STUDY_GUIDE_TERMS.length };
    batch.set(metaRef, { version: STUDY_GUIDE_SEED_VERSION, counts, importedBy: actor.uid, importedAt: Timestamp.now() });
    await batch.commit();
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "study_guide.content_seeded",
      entityType: "study_guide",
      entityId: META_ID,
      metadata: { version: STUDY_GUIDE_SEED_VERSION, counts },
      createdAt: Timestamp.now(),
    });
    return NextResponse.json({ data: { created: true, version: STUDY_GUIDE_SEED_VERSION, counts } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}

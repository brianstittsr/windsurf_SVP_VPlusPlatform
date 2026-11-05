import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { REGISTRATION_COURSE_DRAFTS } from "@/lib/registration-catalog";
import { COLLECTIONS } from "@/lib/schema";

const IMPORT_SOURCE = "EFVS_Student_Registration_Form_Rev2_2026-10-04";

/** Idempotently imports registration-PDF courses and study-guide products as unpublished drafts. */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database is unavailable" }, { status: 503 });
    const existingSnapshot = await adminDb.collection(COLLECTIONS.COURSES).get();
    const existingByCode = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const document of existingSnapshot.docs) {
      const code = document.get("code");
      if (typeof code === "string" && !existingByCode.has(code)) existingByCode.set(code, document);
    }
    const idsByCode = new Map([...existingByCode.entries()].map(([code, document]) => [code, document.id]));
    const created: string[] = [];
    const convertedDemo: string[] = [];
    const conflicts: { code: string; existingId: string }[] = [];

    for (const draft of REGISTRATION_COURSE_DRAFTS) {
      const existing = existingByCode.get(draft.code);
      if (existing) {
        if (draft.code === "AC1" && existing.get("demoSeed") === "ac1-demo") {
          await existing.ref.update({ ...draft, published: false, archived: false, importedFrom: IMPORT_SOURCE, updatedBy: actor.uid, updatedAt: Timestamp.now() });
          convertedDemo.push(existing.id);
          idsByCode.set(draft.code, existing.id);
          continue;
        }
        if (existing.get("importedFrom") === IMPORT_SOURCE) {
          idsByCode.set(draft.code, existing.id);
          continue;
        }
        conflicts.push({ code: draft.code, existingId: existing.id });
        idsByCode.set(draft.code, existing.id);
        continue;
      }
      const ref = adminDb.collection(COLLECTIONS.COURSES).doc();
      const now = Timestamp.now();
      await ref.set({ ...draft, published: false, archived: false, importedFrom: IMPORT_SOURCE, createdBy: actor.uid, createdAt: now, updatedAt: now });
      idsByCode.set(draft.code, ref.id);
      created.push(ref.id);
    }

    const bundleId = idsByCode.get("AC1-SG107");
    const ac1Id = idsByCode.get("AC1");
    const guideId = idsByCode.get("SG107");
    if (bundleId && ac1Id && guideId) {
      const bundleRef = adminDb.collection(COLLECTIONS.COURSES).doc(bundleId);
      const bundleSnap = await bundleRef.get();
      if (bundleSnap.exists && bundleSnap.get("published") !== true && bundleSnap.get("importedFrom") === IMPORT_SOURCE) {
        await bundleRef.update({ includedCourseIds: [ac1Id, guideId], updatedAt: Timestamp.now() });
      }
    }

    return NextResponse.json({ data: {
      created,
      createdCount: created.length,
      convertedDemo,
      conflicts,
      conflictCount: conflicts.length,
      guideCode: "SG107",
      bundleCode: "AC1-SG107",
    } });
  } catch (error) {
    return lmsApiError(error);
  }
}

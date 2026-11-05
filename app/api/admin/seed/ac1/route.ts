import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { AC1_DEMO_TAG, removeAc1DemoData, seedAc1DemoData } from "@/lib/seed-ac1";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const snap = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).where("demoSeed", "==", AC1_DEMO_TAG).limit(1).get();
    return NextResponse.json({ data: { seeded: !snap.empty } });
  } catch (error) {
    return lmsApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    const result = await seedAc1DemoData(actor.uid);
    if (result.created && adminDb) {
      await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "demo.seeded",
        entityType: "course",
        entityId: "AC1",
        metadata: result.counts,
        createdAt: Timestamp.now(),
      });
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    return lmsApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    const removed = await removeAc1DemoData();
    if (adminDb) {
      await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
        actorId: actor.uid,
        actorEmail: actor.email,
        action: "demo.removed",
        entityType: "course",
        entityId: "AC1",
        metadata: removed,
        createdAt: Timestamp.now(),
      });
    }
    return NextResponse.json({ data: removed });
  } catch (error) {
    return lmsApiError(error);
  }
}

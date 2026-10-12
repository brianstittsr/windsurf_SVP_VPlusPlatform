import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { Timestamp } from "firebase-admin/firestore";

function serializeDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    ...data,
    createdAt: (data.createdAt as any)?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
    updatedAt: (data.updatedAt as any)?.toDate?.()?.toISOString() ?? data.updatedAt ?? null,
    intakeSentAt: (data.intakeSentAt as any)?.toDate?.()?.toISOString() ?? data.intakeSentAt ?? null,
  };
}

export async function GET() {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.ZENTHIUM_OPPORTUNITIES)
      .orderBy("createdAt", "desc")
      .get();
    const opportunities = snap.docs.map((doc) => serializeDoc(doc.id, doc.data() as Record<string, unknown>));
    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error("[Zenthium] GET opportunities error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const now = Timestamp.now();
    const docData = {
      ...body,
      status: body.status ?? "draft",
      intakeSentAt: null,
      intakeSentTo: body.intakeSentTo ?? [],
      intakeSentCC: body.intakeSentCC ?? [],
      createdAt: now,
      updatedAt: now,
    };
    const ref = adminDb.collection(COLLECTIONS.ZENTHIUM_OPPORTUNITIES).doc();
    await ref.set(docData);
    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch (error) {
    console.error("[Zenthium] POST opportunity error:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}

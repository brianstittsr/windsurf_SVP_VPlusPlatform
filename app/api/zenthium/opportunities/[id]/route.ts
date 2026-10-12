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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  const { id } = await params;
  try {
    const doc = await adminDb.collection(COLLECTIONS.ZENTHIUM_OPPORTUNITIES).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ opportunity: serializeDoc(doc.id, doc.data() as Record<string, unknown>) });
  } catch (error) {
    console.error("[Zenthium] GET opportunity [id] error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunity" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  const { id } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    await adminDb
      .collection(COLLECTIONS.ZENTHIUM_OPPORTUNITIES)
      .doc(id)
      .update({ ...body, updatedAt: Timestamp.now() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Zenthium] PATCH opportunity [id] error:", error);
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  const { id } = await params;
  try {
    await adminDb.collection(COLLECTIONS.ZENTHIUM_OPPORTUNITIES).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Zenthium] DELETE opportunity [id] error:", error);
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
}

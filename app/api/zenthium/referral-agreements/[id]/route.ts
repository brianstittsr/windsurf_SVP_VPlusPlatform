import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  try {
    const { id } = await params;
    const doc = await adminDb
      .collection(COLLECTIONS.ZENTHIUM_REFERRAL_AGREEMENTS)
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }

    const data = doc.data()!;
    return NextResponse.json({
      agreement: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
        signedAt: data.signedAt?.toDate?.()?.toISOString() ?? data.signedAt ?? null,
      },
    });
  } catch (error) {
    console.error("[Zenthium] GET referral-agreement [id] error:", error);
    return NextResponse.json({ error: "Failed to fetch agreement" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const now = Timestamp.now();

    const updates: Record<string, unknown> = { ...body, updatedAt: now };

    if (body.contractorSignature && body.status === "signed") {
      updates.signedAt = now;
    }

    await adminDb
      .collection(COLLECTIONS.ZENTHIUM_REFERRAL_AGREEMENTS)
      .doc(id)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Zenthium] PATCH referral-agreement [id] error:", error);
    return NextResponse.json({ error: "Failed to update agreement" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  try {
    const { id } = await params;
    await adminDb
      .collection(COLLECTIONS.ZENTHIUM_REFERRAL_AGREEMENTS)
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Zenthium] DELETE referral-agreement [id] error:", error);
    return NextResponse.json({ error: "Failed to delete agreement" }, { status: 500 });
  }
}

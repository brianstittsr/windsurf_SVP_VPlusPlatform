import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, requireAdmin } from "@/lib/capture/server-auth";
import { clientPatchSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const snap = await adminDb.collection(COLLECTIONS.CUSTOMERS).doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  return NextResponse.json({ client: serializeDoc({ id: snap.id, ...snap.data() }) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CUSTOMERS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = clientPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  await ref.update({ ...parsed.data, isCaptureClient: true, updatedAt: FieldValue.serverTimestamp() });

  await captureAudit({
    type: "update",
    entityType: "capture-client",
    entityId: id,
    entityName: parsed.data.name || (snap.data()?.name as string) || "",
    description: `Updated capture client ${parsed.data.name || id}`,
    userId: user.uid,
    metadata: { fields: Object.keys(parsed.data) },
  });

  const updated = await ref.get();
  return NextResponse.json({ client: serializeDoc({ id: updated.id, ...updated.data() }) });
}

/** Soft-delete (rule 10) — admin only. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CUSTOMERS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await ref.update({
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: user.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "delete",
    entityType: "capture-client",
    entityId: id,
    entityName: (snap.data()?.name as string) || "",
    description: `Moved capture client ${(snap.data()?.name as string) || id} to trash`,
    userId: user.uid,
  });

  return NextResponse.json({ ok: true });
}

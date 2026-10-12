import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CustomerDoc } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { opportunityPatchSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { computeWarnings } from "@/lib/capture/warnings";
import { getCaptureSettings } from "@/lib/capture/settings";

type Params = { params: Promise<{ id: string }> };

/** GET — detail, plus computed warnings (rules 7–8). */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const snap = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const data = snap.data()!;
  const clientSnap = data.clientId
    ? await adminDb.collection(COLLECTIONS.CUSTOMERS).doc(data.clientId).get()
    : null;
  const settings = await getCaptureSettings();
  const warnings = computeWarnings(
    data as { setAside?: string },
    clientSnap?.exists ? ({ id: clientSnap.id, ...clientSnap.data() } as CustomerDoc) : null,
    settings.expiryWarningDays
  );

  return NextResponse.json({
    opportunity: serializeDoc({ id: snap.id, ...data }),
    warnings,
    canWrite: canWriteOpportunity(user, data.ownerId),
  });
}

/** PATCH — admin or owning team member; audited (rule 11). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  if (!canWriteOpportunity(user, snap.data()?.ownerId)) {
    return NextResponse.json({ error: "Forbidden: only the owner or an admin can edit" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = opportunityPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  // If clientId changes, re-validate the client (rule 1)
  const updates = { ...parsed.data } as Record<string, unknown>;
  if (updates.clientId) {
    const clientSnap = await adminDb.collection(COLLECTIONS.CUSTOMERS).doc(updates.clientId as string).get();
    if (!clientSnap.exists) return NextResponse.json({ error: "Client not found" }, { status: 400 });
    updates.clientName = (clientSnap.data()?.name as string) || "";
  }
  delete updates.stage; // stage changes go through the gated /stage route
  delete updates.deletedAt;

  await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });

  await captureAudit({
    type: "update",
    entityType: "capture-opportunity",
    entityId: id,
    entityName: (updates.title as string) || (snap.data()?.title as string) || "",
    description: `Updated capture opportunity ${(updates.title as string) || id}`,
    userId: user.uid,
    metadata: { fields: Object.keys(updates) },
  });

  const updated = await ref.get();
  return NextResponse.json({ opportunity: serializeDoc({ id: updated.id, ...updated.data() }) });
}

/** DELETE — soft-delete to trash (rule 10); admin only. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
  }

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  await ref.update({
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: user.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "delete",
    entityType: "capture-opportunity",
    entityId: id,
    entityName: (snap.data()?.title as string) || "",
    description: `Moved capture opportunity ${(snap.data()?.title as string) || id} to trash`,
    userId: user.uid,
  });

  return NextResponse.json({ ok: true });
}

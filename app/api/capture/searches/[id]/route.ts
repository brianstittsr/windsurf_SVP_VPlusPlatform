import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { savedSearchSchema } from "@/lib/capture/validation";

async function getOwned(id: string, uid: string, role: string) {
  const snap = await adminDb!.collection(COLLECTIONS.CAPTURE_SAVED_SEARCHES).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (role !== "admin" && data.ownerId !== uid) return "forbidden" as const;
  return { ref: snap.ref, data };
}

/** PATCH: update a saved search (owner/admin). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const owned = await getOwned(id, user.uid, user.role);
  if (owned === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (owned === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = savedSearchSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  await owned.ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}

/** DELETE: remove a saved search (owner/admin). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const owned = await getOwned(id, user.uid, user.role);
  if (owned === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (owned === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await owned.ref.delete();
  return NextResponse.json({ ok: true });
}

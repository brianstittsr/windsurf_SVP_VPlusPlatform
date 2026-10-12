import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { savedSearchSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import type { CaptureSavedSearchDoc } from "@/lib/schema";

/** GET: list saved searches (caller-scoped unless admin). */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const snap = await adminDb.collection(COLLECTIONS.CAPTURE_SAVED_SEARCHES).get();
  const all = snap.docs.map((d) =>
    serializeDoc({ id: d.id, ...(d.data() as Omit<CaptureSavedSearchDoc, "id">) })
  );
  const searches =
    user.role === "admin" ? all : all.filter((s) => s.ownerId === user.uid);
  return NextResponse.json({ searches });
}

/** POST: create a saved search. */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const docRef = await adminDb.collection(COLLECTIONS.CAPTURE_SAVED_SEARCHES).add({
    ...parsed.data,
    ownerId: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const created = await docRef.get();
  return NextResponse.json({ search: serializeDoc({ id: created.id, ...created.data() }) }, { status: 201 });
}

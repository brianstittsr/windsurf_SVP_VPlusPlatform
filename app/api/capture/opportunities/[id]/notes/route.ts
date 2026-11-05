import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { noteCreateSchema } from "@/lib/capture/validation";

type Params = { params: Promise<{ id: string }> };

/** POST — append a note to the opportunity's notes thread. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  if (!canWriteOpportunity(user, snap.data()?.ownerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = noteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const note = {
    id: crypto.randomUUID(),
    text: parsed.data.text,
    authorId: user.uid,
    authorName: user.displayName,
    createdAt: new Date().toISOString(),
  };
  await ref.update({
    notes: FieldValue.arrayUnion(note),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ note }, { status: 201 });
}

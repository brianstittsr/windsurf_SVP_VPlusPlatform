import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/capture/server-auth";

const COLLECTION = "samSavedOpportunities";

/** DELETE /api/capture/solicitations/[id] — remove from the inbox. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  if (user.role !== "admin" && user.role !== "team") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ref = adminDb.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ref.delete();
  return NextResponse.json({ ok: true });
}

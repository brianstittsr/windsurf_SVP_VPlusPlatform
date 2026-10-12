import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { taskPatchSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";

type Params = { params: Promise<{ id: string }> };

/** PATCH — update a task (assignee, admin, or opportunity owner). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_TASKS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const task = snap.data()!;

  const oppSnap = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(task.opportunityId).get();
  const isAssignee = task.assigneeId === user.teamMemberId || task.assigneeId === user.uid;
  if (!isAssignee && !canWriteOpportunity(user, oppSnap.data()?.ownerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  const updated = await ref.get();
  return NextResponse.json({ task: serializeDoc({ id: updated.id, ...updated.data() }) });
}

/** DELETE — admin or opportunity owner. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_TASKS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const task = snap.data()!;

  const oppSnap = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(task.opportunityId).get();
  if (!canWriteOpportunity(user, oppSnap.data()?.ownerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}

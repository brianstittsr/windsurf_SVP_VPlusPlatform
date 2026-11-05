import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { taskCreateSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { captureAlert } from "@/lib/capture/notify";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const snap = await adminDb
    .collection(COLLECTIONS.CAPTURE_TASKS)
    .where("opportunityId", "==", id)
    .get();
  const tasks = snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() }));
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const oppSnap = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id).get();
  if (!oppSnap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  if (!canWriteOpportunity(user, oppSnap.data()?.ownerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const docRef = await adminDb.collection(COLLECTIONS.CAPTURE_TASKS).add({
    ...parsed.data,
    opportunityId: id,
    status: "open",
    createdById: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "create",
    entityType: "capture-task",
    entityId: docRef.id,
    entityName: parsed.data.title,
    description: `Task "${parsed.data.title}" assigned to ${parsed.data.assigneeName}`,
    userId: user.uid,
    metadata: { opportunityId: id },
  });

  // Task-assigned alert: email the assignee + log it
  if (parsed.data.assigneeId) {
    captureAlert({
      type: "task-assigned",
      entityType: "capture-task",
      entityId: docRef.id,
      entityName: parsed.data.title,
      recipientId: parsed.data.assigneeId,
      message: `You were assigned task "${parsed.data.title}" on "${(oppSnap.data()?.title as string) || ""}"${parsed.data.dueDate ? ` — due ${new Date(parsed.data.dueDate).toLocaleDateString("en-US")}` : ""}`,
      subject: `New task assigned: ${parsed.data.title}`,
    }).catch((e) => console.error("[capture] task-assigned alert failed:", e));
  }

  const created = await docRef.get();
  return NextResponse.json({ task: serializeDoc({ id: created.id, ...created.data() }) }, { status: 201 });
}

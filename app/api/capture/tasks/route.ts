import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CaptureTaskDoc } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { serializeDoc } from "@/lib/capture/serialize";

/**
 * GET /api/capture/tasks — "My tasks": tasks assigned to the caller
 * (?assigneeId= override for admins), sorted by due date.
 */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { searchParams } = req.nextUrl;
  const assigneeId =
    user.role === "admin" && searchParams.get("assigneeId")
      ? searchParams.get("assigneeId")!
      : user.teamMemberId || user.uid;

  const snap = await adminDb
    .collection(COLLECTIONS.CAPTURE_TASKS)
    .where("assigneeId", "==", assigneeId)
    .get();

  const tasks = snap.docs
    .map((d) => serializeDoc({ id: d.id, ...d.data() }) as CaptureTaskDoc)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return NextResponse.json({ tasks });
}

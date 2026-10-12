import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireAdmin } from "@/lib/capture/server-auth";
import { captureAudit } from "@/lib/capture/audit";
import { z } from "zod";

const restoreSchema = z.object({
  type: z.enum(["opportunity", "client"]),
  id: z.string().min(1),
});

/** POST /api/capture/trash/restore — undelete (admin). */
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = restoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { type, id } = parsed.data;

  const collectionName =
    type === "opportunity" ? COLLECTIONS.CAPTURE_OPPORTUNITIES : COLLECTIONS.CUSTOMERS;
  const ref = adminDb.collection(collectionName).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.update({ deletedAt: null, updatedAt: FieldValue.serverTimestamp() });

  await captureAudit({
    type: "update",
    entityType: type === "opportunity" ? "capture-opportunity" : "capture-client",
    entityId: id,
    entityName: ((snap.data()?.title || snap.data()?.name) as string) || "",
    description: `Restored ${type} from trash`,
    userId: user.uid,
  });

  return NextResponse.json({ ok: true });
}

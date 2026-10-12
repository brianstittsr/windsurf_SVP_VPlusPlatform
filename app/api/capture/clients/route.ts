import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CustomerDoc } from "@/lib/schema";
import { requireUser, requireAdmin } from "@/lib/capture/server-auth";
import { clientCreateSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";

/** GET /api/capture/clients — list capture clients (any authenticated user). */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { searchParams } = req.nextUrl;
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  const snap = await adminDb.collection(COLLECTIONS.CUSTOMERS).get();
  const clients = snap.docs
    .map((d) => serializeDoc({ id: d.id, ...d.data() }) as CustomerDoc)
    .filter((c) => c.isCaptureClient && (includeDeleted || !c.deletedAt))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return NextResponse.json({ clients });
}

/** POST /api/capture/clients — create a capture client (admin only, doc §6). */
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = clientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const docRef = await adminDb.collection(COLLECTIONS.CUSTOMERS).add({
    ...parsed.data,
    isCaptureClient: true,
    deletedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "create",
    entityType: "capture-client",
    entityId: docRef.id,
    entityName: parsed.data.name,
    description: `Created capture client ${parsed.data.name}`,
    userId: user.uid,
  });

  const created = await docRef.get();
  return NextResponse.json({ client: serializeDoc({ id: created.id, ...created.data() }) }, { status: 201 });
}

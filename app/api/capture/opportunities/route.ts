import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { opportunityCreateSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { stagesForBoard } from "@/lib/capture/stages";

/** GET /api/capture/opportunities — list w/ filters: clientId, stage, ownerId, type. */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { searchParams } = req.nextUrl;
  let query = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).where("deletedAt", "==", null) as FirebaseFirestore.Query;

  const clientId = searchParams.get("clientId");
  const stage = searchParams.get("stage");
  const ownerId = searchParams.get("ownerId");
  const type = searchParams.get("type");
  if (clientId) query = query.where("clientId", "==", clientId);
  if (stage) query = query.where("stage", "==", stage);
  if (ownerId) query = query.where("ownerId", "==", ownerId);
  if (type) query = query.where("type", "==", type);

  const snap = await query.get();
  const opportunities = snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() }));
  return NextResponse.json({ opportunities });
}

/** POST /api/capture/opportunities — create (rules 1, 4, 9). Admin or team. */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  if (user.role !== "admin" && user.role !== "team") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = opportunityCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const data = parsed.data;

  // Rule 1: client must exist and be a capture client
  const clientSnap = await adminDb.collection(COLLECTIONS.CUSTOMERS).doc(data.clientId).get();
  if (!clientSnap.exists || clientSnap.data()?.deletedAt) {
    return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  // Rule 9: no duplicate solicitationNumber + clientId
  const dupe = await adminDb
    .collection(COLLECTIONS.CAPTURE_OPPORTUNITIES)
    .where("clientId", "==", data.clientId)
    .where("solicitationNumber", "==", data.solicitationNumber)
    .where("deletedAt", "==", null)
    .limit(1)
    .get();
  if (!dupe.empty) {
    return NextResponse.json(
      { error: "An opportunity with this solicitation number already exists for this client", duplicateId: dupe.docs[0].id },
      { status: 409 }
    );
  }

  const initialStage = data.stage || stagesForBoard(data.boardType)[0].id;
  const docRef = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).add({
    ...data,
    clientName: (clientSnap.data()?.name as string) || "",
    stage: initialStage,
    files: [],
    notes: data.notes || [],
    deletedAt: null,
    createdById: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "create",
    entityType: "capture-opportunity",
    entityId: docRef.id,
    entityName: data.title,
    description: `Created capture opportunity ${data.title}`,
    userId: user.uid,
  });

  const created = await docRef.get();
  return NextResponse.json({ opportunity: serializeDoc({ id: created.id, ...created.data() }) }, { status: 201 });
}

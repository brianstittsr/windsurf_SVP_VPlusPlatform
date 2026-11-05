import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";

/**
 * POST /api/capture/opportunities/[id]/convert — convert an RFI-board
 * opportunity to a standard RFP pursuit (resets to the start of the pipeline).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const ref = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  const opp = snap.data()!;
  if (!canWriteOpportunity(user, opp.ownerId)) {
    return NextResponse.json({ error: "Forbidden: only the owner or an admin can convert" }, { status: 403 });
  }
  if (opp.boardType !== "rfi") {
    return NextResponse.json({ error: "Only RFI-board opportunities can be converted" }, { status: 400 });
  }
  if (["closed", "won", "lost"].includes(opp.stage)) {
    return NextResponse.json({ error: "Cannot convert a closed opportunity" }, { status: 400 });
  }

  await ref.update({
    type: "rfp",
    boardType: "standard",
    stage: "found",
    convertedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await captureAudit({
    type: "update",
    entityType: "capture-opportunity",
    entityId: id,
    entityName: (opp.title as string) || "",
    description: `Converted "${(opp.title as string) || id}" from RFI to RFP pursuit`,
    userId: user.uid,
    metadata: { fromBoardType: "rfi", toBoardType: "standard" },
  });

  const updated = await ref.get();
  return NextResponse.json({ opportunity: serializeDoc({ id: updated.id, ...updated.data() }) });
}

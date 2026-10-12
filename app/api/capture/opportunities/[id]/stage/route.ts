import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { stageTransitionSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { isValidTransition, passesBidNoBidGate, stageLabel } from "@/lib/capture/stages";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/capture/opportunities/[id]/stage — gated stage transition.
 * Rule 2: moving past bid-no-bid requires an admin decision + reason.
 * Rule 3: "submitted" requires submittedAt + a final-submission tagged file.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  const opp = snap.data()!;
  if (!canWriteOpportunity(user, opp.ownerId)) {
    return NextResponse.json({ error: "Forbidden: only the owner or an admin can move stages" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = stageTransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { toStage, bidNoBid, submittedAt, finalSubmissionFileId, outcome } = parsed.data;

  const validity = isValidTransition(opp.boardType, opp.stage, toStage);
  if (!validity.ok) {
    return NextResponse.json({ error: validity.reason }, { status: 400 });
  }

  const updates: Record<string, unknown> = { stage: toStage };

  // Rule 2: bid/no-bid gate — decision by admin only
  if (passesBidNoBidGate(opp.boardType, toStage)) {
    const existing = opp.bidNoBid || {};
    if (!existing.decision && !bidNoBid?.decision) {
      return NextResponse.json(
        { error: "A Bid/No-Bid decision is required before moving past the gate", requiresBidNoBid: true },
        { status: 422 }
      );
    }
    if (bidNoBid?.decision) {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Only an admin can record a Bid/No-Bid decision" }, { status: 403 });
      }
      if (!bidNoBid.reason?.trim()) {
        return NextResponse.json({ error: "A reason is required for the Bid/No-Bid decision" }, { status: 400 });
      }
      updates.bidNoBid = {
        ...existing,
        decision: bidNoBid.decision,
        reason: bidNoBid.reason,
        decidedById: user.uid,
        decidedByName: user.displayName,
        decidedAt: new Date().toISOString(),
      };
    }
    if ((updates.bidNoBid as typeof existing | undefined)?.decision === "no-bid" || existing.decision === "no-bid") {
      // A no-bid decision doesn't advance the card — close it instead
      if (!["closed", "lost"].includes(toStage)) {
        return NextResponse.json({ error: "A no-bid decision closes the opportunity" }, { status: 400 });
      }
    }
  }

  // Rule 3: submitted gate — date + final-submission file
  if (toStage === "submitted") {
    const files = (opp.files || []) as { id: string; tag: string }[];
    const finalFileId = finalSubmissionFileId || files.find((f) => f.tag === "final-submission")?.id;
    const hasFinal = files.some((f) => f.tag === "final-submission" && (!finalSubmissionFileId || f.id === finalSubmissionFileId));
    if (!submittedAt && !opp.submittedAt) {
      return NextResponse.json(
        { error: "A submission date is required to move to Submitted", requiresSubmission: true },
        { status: 422 }
      );
    }
    if (!hasFinal) {
      return NextResponse.json(
        { error: "Upload a file tagged 'final-submission' before moving to Submitted", requiresSubmission: true },
        { status: 422 }
      );
    }
    updates.submittedAt = submittedAt || opp.submittedAt;
    updates.finalSubmissionFileId = finalFileId;
  }

  if (["won", "lost", "closed"].includes(toStage) && outcome) {
    updates.outcome = outcome;
  }

  await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });

  await captureAudit({
    type: "update",
    entityType: "capture-opportunity",
    entityId: id,
    entityName: (opp.title as string) || "",
    description: `Moved ${(opp.title as string) || id} from ${stageLabel(opp.boardType, opp.stage)} to ${stageLabel(opp.boardType, toStage)}`,
    userId: user.uid,
    metadata: { fromStage: opp.stage, toStage },
  });

  const updated = await ref.get();
  return NextResponse.json({ opportunity: serializeDoc({ id: updated.id, ...updated.data() }) });
}

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { promoteSchema } from "@/lib/capture/validation";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { searchSamOpportunities } from "@/lib/capture/sam-search";

/**
 * POST /api/capture/promote — turn a saved SAM notice into a capture
 * opportunity (source: "imported"). Accepts a samSavedOpportunities doc ID
 * or raw notice fields via samNoticeId + notice fetch.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  if (user.role !== "admin" && user.role !== "team") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = promoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { samSavedOpportunityId, samNoticeId, clientId, ownerId, ownerName } = parsed.data;

  // Pull notice fields from a saved SAM record when available
  let notice: Record<string, unknown> = {};
  let resolvedNoticeId = samNoticeId;
  if (samSavedOpportunityId) {
    const savedSnap = await adminDb.collection("samSavedOpportunities").doc(samSavedOpportunityId).get();
    if (savedSnap.exists) {
      notice = savedSnap.data()!;
      resolvedNoticeId = resolvedNoticeId || (notice.noticeId as string) || (notice.notice_id as string);
    }
  }

  // Only a notice ID? Fetch it live from SAM.gov to populate fields
  if (resolvedNoticeId && !Object.keys(notice).length) {
    const { notices } = await searchSamOpportunities({ noticeId: resolvedNoticeId, limit: 1 });
    if (notices[0]) {
      const n = notices[0];
      notice = {
        title: n.title,
        solicitationNumber: n.solicitationNumber,
        agency: n.department || n.subTier,
        office: n.office,
        setAside: n.setAside,
        naicsCode: n.naicsCode,
        description: n.description,
        responseDeadLine: n.responseDeadLine,
      };
    }
  }

  // Validate client
  const clientSnap = await adminDb.collection(COLLECTIONS.CUSTOMERS).doc(clientId).get();
  if (!clientSnap.exists || clientSnap.data()?.deletedAt) {
    return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  const solicitationNumber =
    (notice.solicitationNumber as string) || (notice.solicitation_number as string) || resolvedNoticeId || "";
  if (solicitationNumber) {
    const dupe = await adminDb
      .collection(COLLECTIONS.CAPTURE_OPPORTUNITIES)
      .where("clientId", "==", clientId)
      .where("solicitationNumber", "==", solicitationNumber)
      .where("deletedAt", "==", null)
      .limit(1)
      .get();
    if (!dupe.empty) {
      return NextResponse.json(
        { error: "Already on the board for this client", duplicateId: dupe.docs[0].id },
        { status: 409 }
      );
    }
  }

  const title = (notice.title as string) || solicitationNumber || "Imported opportunity";
  const docRef = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).add({
    clientId,
    clientName: (clientSnap.data()?.name as string) || "",
    title,
    solicitationNumber,
    samNoticeId: resolvedNoticeId || null,
    source: "imported",
    type: "rfp",
    boardType: "standard",
    agency: (notice.department as string) || (notice.agency as string) || "",
    office: (notice.office as string) || null,
    naicsCode: (notice.naicsCode as string) || null,
    setAside: (notice.typeOfSetAside as string) || (notice.setAside as string) || null,
    description: (notice.description as string) || null,
    responseDue: notice.responseDeadLine
      ? { at: new Date(notice.responseDeadLine as string).toISOString(), timezone: "America/New_York" }
      : null,
    stage: "found",
    ownerId: ownerId || null,
    ownerName: ownerName || null,
    links: { samUrl: resolvedNoticeId ? `https://sam.gov/opp/${resolvedNoticeId}/view` : null },
    files: [],
    notes: [],
    deletedAt: null,
    createdById: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "create",
    entityType: "capture-opportunity",
    entityId: docRef.id,
    entityName: title,
    description: `Promoted SAM notice to board: ${title}`,
    userId: user.uid,
  });

  const created = await docRef.get();
  return NextResponse.json({ opportunity: serializeDoc({ id: created.id, ...created.data() }) }, { status: 201 });
}

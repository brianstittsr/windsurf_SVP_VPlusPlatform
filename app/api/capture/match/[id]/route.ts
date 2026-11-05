import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { matchActionSchema } from "@/lib/capture/validation";
import { captureAudit } from "@/lib/capture/audit";

/**
 * POST /api/capture/match/[id] — accept (creates opportunity at stage "found")
 * or dismiss a queued match.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  if (user.role !== "admin" && user.role !== "team") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = matchActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const ref = adminDb.collection(COLLECTIONS.CAPTURE_MATCHES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const match = snap.data()!;
  if (match.status !== "pending") {
    return NextResponse.json({ error: "Match already actioned" }, { status: 409 });
  }

  if (parsed.data.action === "dismiss") {
    await ref.update({
      status: "dismissed",
      actionedBy: user.uid,
      actionedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, status: "dismissed" });
  }

  // Accept → create the opportunity
  const docRef = await adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).add({
    clientId: match.clientId,
    clientName: match.clientName || "",
    title: match.title || "Matched opportunity",
    solicitationNumber: match.solicitationNumber || "",
    samNoticeId: match.samNoticeId || null,
    source: "imported",
    type: "rfp",
    boardType: "standard",
    agency: match.agency || "",
    office: match.office || null,
    naicsCode: match.naicsCode || null,
    setAside: match.setAside || null,
    description: match.description || null,
    stage: "found",
    ownerId: parsed.data.ownerId || null,
    ownerName: parsed.data.ownerName || null,
    links: { samUrl: match.samNoticeId ? `https://sam.gov/opp/${match.samNoticeId}/view` : null },
    files: [],
    notes: [],
    matchScore: match.score,
    matchBreakdown: match.scoreBreakdown || null,
    deletedAt: null,
    createdById: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await ref.update({
    status: "accepted",
    opportunityId: docRef.id,
    actionedBy: user.uid,
    actionedAt: FieldValue.serverTimestamp(),
  });
  await captureAudit({
    type: "create",
    entityType: "capture-opportunity",
    entityId: docRef.id,
    entityName: match.title || "",
    description: `Accepted match → created "${match.title || docRef.id}" (score ${match.score})`,
    userId: user.uid,
  });

  return NextResponse.json({ ok: true, status: "accepted", opportunityId: docRef.id });
}

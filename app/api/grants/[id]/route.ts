import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOpportunityDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { grantPatchSchema } from "@/lib/grants/validation";
import { syncGrantDeadlineEvent } from "@/lib/grants/calendar";

type Params = { params: Promise<{ id: string }> };

function parseDeadline(value?: string | null): Timestamp | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : Timestamp.fromDate(d);
}

/** GET /api/grants/[id] — grant detail with org profile + documents. */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id } = await params;

  const snap = await adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  const grant = serializeDoc({ id: snap.id, ...snap.data() } as GrantOpportunityDoc);

  const [orgSnap, docsSnap] = await Promise.all([
    grant.orgProfileId
      ? adminDb.collection(COLLECTIONS.GRANT_ORG_PROFILES).doc(grant.orgProfileId).get()
      : Promise.resolve(null),
    adminDb.collection(COLLECTIONS.GRANT_DOCUMENTS).where("grantId", "==", id).get(),
  ]);
  const orgProfile =
    orgSnap && orgSnap.exists ? serializeDoc({ id: orgSnap.id, ...orgSnap.data() }) : null;
  const documents = docsSnap.docs
    .map((d) => serializeDoc({ id: d.id, ...d.data() }) as { id: string; createdAt?: string })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return NextResponse.json({ grant, orgProfile, documents });
}

/** PATCH /api/grants/[id] — update fields, stage, requirements, questions; optional calendar sync. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = grantPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const ref = adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  const existing = snap.data() as GrantOpportunityDoc;
  const data = parsed.data;

  const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
  for (const key of ["title", "funder", "description", "eligibility", "outcomeNotes"] as const) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  if (data.sourceUrl !== undefined) update.sourceUrl = data.sourceUrl || null;
  if (data.awardMin !== undefined) update.awardMin = data.awardMin;
  if (data.awardMax !== undefined) update.awardMax = data.awardMax;
  if (data.orgProfileId !== undefined) update.orgProfileId = data.orgProfileId;
  if (data.customerId !== undefined) update.customerId = data.customerId;
  if (data.requirements !== undefined) update.requirements = data.requirements;
  if (data.questions !== undefined) update.questions = data.questions;
  if (data.stage !== undefined) {
    update.stage = data.stage;
    if (data.stage === "submitted" && !existing.submittedAt) update.submittedAt = Timestamp.now();
  }
  if (data.submittedAt !== undefined) {
    update.submittedAt = data.submittedAt ? Timestamp.fromDate(new Date(data.submittedAt)) : null;
  }

  const deadlineAt = parseDeadline(data.deadlineAt);
  if (deadlineAt !== undefined) update.deadlineAt = deadlineAt;

  const titleChanged = data.title !== undefined && data.title !== existing.title;
  const shouldSyncCalendar =
    deadlineAt !== undefined || data.syncCalendar === true || (titleChanged && existing.calendarEventId);
  if (shouldSyncCalendar) {
    const effectiveDeadline = deadlineAt !== undefined ? deadlineAt : existing.deadlineAt || null;
    const eventId = await syncGrantDeadlineEvent({
      grantId: id,
      title: (data.title as string) || existing.title,
      funder: (data.funder as string) || existing.funder,
      deadlineAt: effectiveDeadline,
      existingEventId: existing.calendarEventId,
    });
    update.calendarEventId = eventId;
  }

  await ref.update(update);
  const updated = { ...existing, ...update } as GrantOpportunityDoc;

  if (data.stage !== undefined && data.stage !== existing.stage) {
    await captureAudit({
      type: "update",
      entityType: "grant",
      entityId: id,
      entityName: updated.title,
      description: `${user.displayName} moved "${updated.title}" to ${data.stage}`,
      userId: user.uid,
    });
  }
  return NextResponse.json({ grant: serializeDoc({ ...updated, id }) });
}

/** DELETE /api/grants/[id] — admin only (enforced via role). */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id } = await params;

  const ref = adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  const grant = snap.data() as GrantOpportunityDoc;

  if (grant.calendarEventId) {
    await adminDb.collection(COLLECTIONS.CALENDAR_EVENTS).doc(grant.calendarEventId).delete().catch(() => undefined);
  }
  const docs = await adminDb.collection(COLLECTIONS.GRANT_DOCUMENTS).where("grantId", "==", id).get();
  await Promise.all(docs.docs.map((d) => d.ref.update({ grantId: null }).catch(() => undefined)));
  await ref.delete();

  await captureAudit({
    type: "delete",
    entityType: "grant",
    entityId: id,
    entityName: grant.title,
    description: `${user.displayName} deleted grant "${grant.title}"`,
    userId: user.uid,
  });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOpportunityDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { grantCreateSchema } from "@/lib/grants/validation";
import { isGrantStage } from "@/lib/grants/stages";
import { syncGrantDeadlineEvent } from "@/lib/grants/calendar";

function parseDeadline(value?: string): Timestamp | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : Timestamp.fromDate(d);
}

/** GET /api/grants — list grants (optional ?stage=, ?q=). */
export async function GET(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { searchParams } = req.nextUrl;
  const stage = searchParams.get("stage");
  const q = (searchParams.get("q") || "").toLowerCase();

  let query = adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES) as FirebaseFirestore.Query;
  if (stage && isGrantStage(stage)) query = query.where("stage", "==", stage);

  const snap = await query.get();
  let grants = snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() } as GrantOpportunityDoc));
  if (q) {
    grants = grants.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.funder || "").toLowerCase().includes(q) ||
        (g.description || "").toLowerCase().includes(q)
    );
  }
  return NextResponse.json({ grants });
}

/** POST /api/grants — manual grant creation. */
export async function POST(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = grantCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const data = parsed.data;
  const deadlineAt = parseDeadline(data.deadlineAt);
  const now = Timestamp.now();

  const grant = {
    title: data.title,
    funder: data.funder || undefined,
    sourceUrl: data.sourceUrl || undefined,
    description: data.description || undefined,
    eligibility: data.eligibility || undefined,
    awardMin: data.awardMin,
    awardMax: data.awardMax,
    deadlineAt,
    stage: "discovered",
    requirements: [],
    questions: [],
    orgProfileId: data.orgProfileId || undefined,
    createdBy: user.teamMemberId || user.uid,
    createdByName: user.displayName,
    createdAt: now,
    updatedAt: now,
  } as unknown as Omit<GrantOpportunityDoc, "id"> & { calendarEventId?: string };

  if (deadlineAt) {
    const eventId = await syncGrantDeadlineEvent({ grantId: "pending", title: data.title, funder: data.funder, deadlineAt });
    if (eventId) grant.calendarEventId = eventId;
  }

  const ref = await adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).add(grant);
  if (grant.calendarEventId) {
    await adminDb.collection(COLLECTIONS.CALENDAR_EVENTS).doc(grant.calendarEventId).update({ grantId: ref.id });
  }
  await captureAudit({
    type: "create",
    entityType: "grant",
    entityId: ref.id,
    entityName: data.title,
    description: `${user.displayName} added grant "${data.title}"`,
    userId: user.uid,
  });
  return NextResponse.json({ grant: serializeDoc({ id: ref.id, ...grant }) }, { status: 201 });
}

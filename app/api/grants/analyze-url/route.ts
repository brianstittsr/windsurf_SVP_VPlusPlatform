import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOpportunityDoc, type GrantQuestion, type GrantRequirement } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { analyzeUrlSchema } from "@/lib/grants/validation";
import { analyzeGrantUrl } from "@/lib/grants/analyze";
import { syncGrantDeadlineEvent } from "@/lib/grants/calendar";
import { randomUUID } from "crypto";

/** POST /api/grants/analyze-url — crawl a grant page, AI-extract details, create a grant at stage "analyzed". */
export async function POST(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = analyzeUrlSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A valid grant URL is required" }, { status: 400 });

  let analysis: Awaited<ReturnType<typeof analyzeGrantUrl>>;
  try {
    analysis = await analyzeGrantUrl(parsed.data.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
  const { grant: extracted } = analysis;

  const requirements: GrantRequirement[] = extracted.requirements.map((text) => ({
    id: randomUUID(),
    text,
    met: false,
  }));
  const questions: GrantQuestion[] = extracted.questions.map((text) => ({
    id: randomUUID(),
    text,
    required: true,
    status: "pending",
  }));
  const deadlineAt = extracted.deadline ? Timestamp.fromDate(new Date(extracted.deadline)) : undefined;
  const now = Timestamp.now();

  const grant = {
    title: extracted.title,
    funder: extracted.funder,
    sourceUrl: parsed.data.url,
    description: extracted.description,
    eligibility: extracted.eligibility,
    awardMin: extracted.awardMin ?? undefined,
    awardMax: extracted.awardMax ?? undefined,
    deadlineAt: deadlineAt && !Number.isNaN(deadlineAt.toMillis()) ? deadlineAt : undefined,
    stage: "analyzed",
    aiSummary: extracted.summary,
    analyzedAt: now,
    requirements,
    questions,
    createdBy: user.teamMemberId || user.uid,
    createdByName: user.displayName,
    createdAt: now,
    updatedAt: now,
  } as unknown as Omit<GrantOpportunityDoc, "id">;

  const ref = await adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).add(grant);
  if (grant.deadlineAt) {
    const eventId = await syncGrantDeadlineEvent({
      grantId: ref.id,
      title: grant.title,
      funder: grant.funder,
      deadlineAt: grant.deadlineAt,
    });
    if (eventId) await ref.update({ calendarEventId: eventId });
  }

  await captureAudit({
    type: "create",
    entityType: "grant",
    entityId: ref.id,
    entityName: grant.title,
    description: `${user.displayName} analyzed grant "${grant.title}" from ${parsed.data.url} (${questions.length} questions, ${requirements.length} requirements)`,
    userId: user.uid,
  });
  return NextResponse.json({ grant: serializeDoc({ id: ref.id, ...grant }) }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOpportunityDoc, type GrantQuestion, type GrantRequirement } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { analyzeGrantUrl } from "@/lib/grants/analyze";
import { syncGrantDeadlineEvent } from "@/lib/grants/calendar";

const importSchema = z.object({
  title: z.string().min(1).max(300),
  funder: z.string().max(300).optional(),
  summary: z.string().max(20_000).optional(),
  eligibility: z.string().max(20_000).optional(),
  awardMin: z.number().nonnegative().optional(),
  awardMax: z.number().nonnegative().optional(),
  deadline: z.string().max(60).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  detailsUrl: z.string().url().max(2000).optional(),
  analyze: z.boolean().default(true),
});

function parseDeadline(value?: string): Timestamp | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : Timestamp.fromDate(d);
}

/**
 * POST /api/grants/import — ingest a GrantedAI search result into the pipeline.
 * Dedupes on sourceUrl. When analyze=true and a source URL exists, also runs the
 * AI page analysis to extract requirements/questions (best-effort).
 */
export async function POST(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid import payload" }, { status: 400 });
  }
  const data = parsed.data;

  // Dedupe: same source URL already on the board?
  if (data.sourceUrl) {
    const dup = await adminDb
      .collection(COLLECTIONS.GRANT_OPPORTUNITIES)
      .where("sourceUrl", "==", data.sourceUrl)
      .limit(1)
      .get();
    if (!dup.empty) {
      const existing = serializeDoc({ id: dup.docs[0].id, ...dup.docs[0].data() });
      return NextResponse.json({ grant: existing, alreadyImported: true });
    }
  }

  const deadlineAt = parseDeadline(data.deadline);
  const now = Timestamp.now();

  // Best-effort AI analysis of the source page to extract requirements/questions
  let requirements: GrantRequirement[] = [];
  let questions: GrantQuestion[] = [];
  let aiSummary: string | undefined;
  let stage: GrantOpportunityDoc["stage"] = "discovered";
  let analyzedAt: Timestamp | undefined;
  let analyzeError: string | undefined;

  if (data.analyze && data.sourceUrl) {
    try {
      const { grant: extracted } = await analyzeGrantUrl(data.sourceUrl);
      requirements = extracted.requirements.map((text) => ({ id: randomUUID(), text, met: false }));
      questions = extracted.questions.map((text) => ({ id: randomUUID(), text, required: true, status: "pending" }));
      aiSummary = extracted.summary;
      stage = "analyzed";
      analyzedAt = now;
    } catch (error) {
      analyzeError = error instanceof Error ? error.message : "Page analysis failed";
    }
  }

  const grant = {
    title: data.title,
    funder: data.funder,
    sourceUrl: data.sourceUrl,
    description: data.summary,
    eligibility: data.eligibility,
    awardMin: data.awardMin,
    awardMax: data.awardMax,
    deadlineAt,
    stage,
    aiSummary,
    analyzedAt,
    requirements,
    questions,
    createdBy: user.teamMemberId || user.uid,
    createdByName: user.displayName,
    createdAt: now,
    updatedAt: now,
  } as unknown as Omit<GrantOpportunityDoc, "id">;

  const ref = await adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).add(grant);
  if (deadlineAt) {
    const eventId = await syncGrantDeadlineEvent({
      grantId: ref.id,
      title: data.title,
      funder: data.funder,
      deadlineAt,
    });
    if (eventId) await ref.update({ calendarEventId: eventId });
  }

  await captureAudit({
    type: "create",
    entityType: "grant",
    entityId: ref.id,
    entityName: data.title,
    description: `${user.displayName} imported grant "${data.title}"${questions.length ? ` (${questions.length} questions extracted)` : ""}`,
    userId: user.uid,
  });

  return NextResponse.json(
    { grant: serializeDoc({ id: ref.id, ...grant }), analyzeError },
    { status: 201 }
  );
}

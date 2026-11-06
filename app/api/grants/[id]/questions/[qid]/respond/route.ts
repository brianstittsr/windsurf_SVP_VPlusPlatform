import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOpportunityDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { captureAudit } from "@/lib/capture/audit";
import { respondSchema } from "@/lib/grants/validation";

type Params = { params: Promise<{ id: string; qid: string }> };

/** POST /api/grants/[id]/questions/[qid]/respond — accept or save an edited response. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id, qid } = await params;

  const body = await req.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A response is required" }, { status: 400 });

  const ref = adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  const grant = snap.data() as GrantOpportunityDoc;

  const idx = grant.questions.findIndex((q) => q.id === qid);
  if (idx === -1) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const edited = parsed.data.response !== (grant.questions[idx].aiDraft || "");
  const questions = grant.questions.map((q, i) =>
    i === idx
      ? {
          ...q,
          response: parsed.data.response,
          status: edited ? ("edited" as const) : ("accepted" as const),
          answeredAt: new Date().toISOString(),
          answeredBy: user.displayName,
        }
      : q
  );
  const answeredCount = questions.filter((q) => q.response).length;

  await ref.update({ questions, updatedAt: Timestamp.now() });
  await captureAudit({
    type: "update",
    entityType: "grant",
    entityId: id,
    entityName: grant.title,
    description: `${user.displayName} ${edited ? "edited" : "accepted"} a response (${answeredCount}/${questions.length})`,
    userId: user.uid,
  });
  return NextResponse.json({ questionId: qid, status: edited ? "edited" : "accepted", answeredCount, totalCount: questions.length });
}

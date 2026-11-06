import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantDocumentDoc, type GrantOpportunityDoc, type GrantOrgProfileDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { draftAnswer } from "@/lib/grants/answer";

type Params = { params: Promise<{ id: string; qid: string }> };

/** POST /api/grants/[id]/questions/[qid]/draft — generate an AI draft for one question. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id, qid } = await params;

  const ref = adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  const grant = snap.data() as GrantOpportunityDoc;

  const idx = grant.questions.findIndex((q) => q.id === qid);
  if (idx === -1) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const [orgSnap, docsSnap] = await Promise.all([
    grant.orgProfileId
      ? adminDb.collection(COLLECTIONS.GRANT_ORG_PROFILES).doc(grant.orgProfileId).get()
      : Promise.resolve(null),
    adminDb.collection(COLLECTIONS.GRANT_DOCUMENTS).where("grantId", "==", id).get(),
  ]);
  const orgProfile =
    orgSnap && orgSnap.exists ? ({ id: orgSnap.id, ...orgSnap.data() } as GrantOrgProfileDoc) : null;
  const documents = docsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as GrantDocumentDoc)
    .filter((d) => d.status === "converted" && d.markdown);

  let draft: string;
  try {
    draft = await draftAnswer({ grant, questionText: grant.questions[idx].text, orgProfile, documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Drafting failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const questions = grant.questions.map((q, i) =>
    i === idx ? { ...q, aiDraft: draft, status: "drafted" as const } : q
  );
  const update: Record<string, unknown> = { questions, updatedAt: Timestamp.now() };
  if (grant.stage === "analyzed" || grant.stage === "discovered") update.stage = "drafting";
  await ref.update(update);

  return NextResponse.json({ questionId: qid, aiDraft: draft });
}

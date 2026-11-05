import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { summarizeSchema } from "@/lib/capture/validation";
import { createOpenAIClient } from "@/lib/openai-config";

/**
 * POST /api/capture/summarize — OpenAI summary for an opportunity or match.
 * Persists the result to `aiSummary` on the document.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const client = await createOpenAIClient();
  if (!client) {
    return NextResponse.json({ error: "AI summarization is not configured on this deployment" }, { status: 503 });
  }

  let docRef;
  if (parsed.data.opportunityId) {
    docRef = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(parsed.data.opportunityId);
  } else {
    docRef = adminDb.collection(COLLECTIONS.CAPTURE_MATCHES).doc(parsed.data.matchId!);
  }
  const snap = await docRef.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const context = snap.data()! as Record<string, unknown>;
  const rd = context.responseDue as { at?: string } | string | undefined;
  const responseDueText = typeof rd === "string" ? rd : rd?.at;

  const prompt = `Summarize this government contracting opportunity in ~120 words for a capture manager. Cover: what it is, who it's for (agency/set-aside), key deadlines, and an initial fit assessment.

Title: ${context.title || ""}
Agency: ${context.agency || ""} ${context.office || ""}
Solicitation: ${context.solicitationNumber || ""}
Type: ${context.type || ""} / Stage: ${context.stage || ""}
Set-aside: ${context.setAside || "none"}
NAICS: ${context.naicsCode || ""}
Client: ${context.clientName || ""}
Response due: ${responseDueText || "not set"}
Description: ${context.description || "(none)"}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.4,
  });
  const summary = completion.choices[0]?.message?.content?.trim();
  if (!summary) return NextResponse.json({ error: "AI returned no summary" }, { status: 502 });

  await docRef.update({
    aiSummary: summary,
    aiSummaryAt: new Date().toISOString(),
  });
  return NextResponse.json({ summary });
}

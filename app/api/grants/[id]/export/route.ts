import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOpportunityDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";

type Params = { params: Promise<{ id: string }> };

/** GET /api/grants/[id]/export — markdown application package (all questions + responses). */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id } = await params;

  const snap = await adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  const grant = snap.data() as GrantOpportunityDoc;

  const lines: string[] = [
    `# ${grant.title}`,
    "",
    `**Funder:** ${grant.funder || "—"}`,
    `**Deadline:** ${grant.deadlineAt?.toDate().toISOString().slice(0, 10) || "—"}`,
    `**Status:** ${grant.stage}`,
    grant.sourceUrl ? `**Source:** ${grant.sourceUrl}` : "",
    "",
    "---",
    "",
  ];
  if (grant.requirements.length) {
    lines.push("## Submission Requirements", "");
    for (const r of grant.requirements) lines.push(`- [${r.met ? "x" : " "}] ${r.text}${r.notes ? ` — ${r.notes}` : ""}`);
    lines.push("", "---", "");
  }
  lines.push("## Application Responses", "");
  for (const q of grant.questions) {
    lines.push(`### ${q.text}`, "");
    lines.push(q.response || "_(unanswered)_", "");
  }

  const markdown = lines.filter((l) => l !== undefined).join("\n");
  const fileName = `${grant.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "grant"}-application.md`;
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

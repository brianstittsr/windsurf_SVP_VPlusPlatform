import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/capture/server-auth";
import { samLinkSchema } from "@/lib/capture/validation";
import { parseNoticeId, searchSamOpportunities, fetchNoticeDescription } from "@/lib/capture/sam-search";

/**
 * POST /api/capture/import/sam-link — parse a SAM.gov notice URL/ID and
 * return a prefilled opportunity draft for the create form.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const parsed = samLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const noticeId = parseNoticeId(parsed.data.url);
  if (!noticeId) {
    return NextResponse.json(
      { error: "Could not parse a SAM.gov notice ID from that URL" },
      { status: 400 }
    );
  }

  const { notices, error } = await searchSamOpportunities({ noticeId, limit: 1 });
  if (error) {
    return NextResponse.json({ error }, { status: 503 });
  }
  const notice = notices[0];
  if (!notice) {
    return NextResponse.json({ error: "Notice not found on SAM.gov" }, { status: 404 });
  }

  const description = await fetchNoticeDescription(noticeId);

  return NextResponse.json({
    draft: {
      samNoticeId: noticeId,
      source: "imported",
      title: notice.title || "",
      solicitationNumber: notice.solicitationNumber || "",
      agency: notice.department || notice.subTier || "",
      office: notice.office || "",
      type: "rfp",
      setAside: notice.setAside || undefined,
      naicsCode: notice.naicsCode || undefined,
      description: description || notice.description || undefined,
      responseDue: notice.responseDeadLine
        ? { at: new Date(notice.responseDeadLine).toISOString(), timezone: "America/New_York" }
        : undefined,
      links: { samUrl: notice.uiLink || `https://sam.gov/opp/${noticeId}/view` },
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireGrantStaff } from "@/lib/grants/access";
import { discoverGrants, searchGrantDb, GrantedApiError } from "@/lib/grants/grantedai";

/**
 * GET /api/grants/discover — GrantedAI-powered grant search.
 * mode=ai  → /discover (natural-language, fit-scored; limited daily)
 * mode=db  → /grants (structured filters, no AI cost)
 */
export async function GET(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;

  const sp = req.nextUrl.searchParams;
  const mode = sp.get("mode") === "db" ? "db" : "ai";
  const q = (sp.get("q") || "").trim();
  const state = sp.get("state") || undefined;
  const funder = sp.get("funder") || undefined;
  const limit = Math.min(Number(sp.get("limit")) || 25, 50);

  try {
    if (mode === "ai") {
      if (q.length < 3) {
        return NextResponse.json({ error: "Enter a search query of at least 3 characters" }, { status: 400 });
      }
      const result = await discoverGrants({
        q,
        state,
        funder,
        source: sp.get("source") || undefined,
        orgType: sp.get("orgType") || undefined,
        includeHistorical: sp.get("includeHistorical") === "true",
        limit,
      });
      return NextResponse.json(result);
    }

    const result = await searchGrantDb({
      q: q || undefined,
      state,
      funder,
      status: sp.get("status") || "active",
      amountMin: sp.get("amountMin") ? Number(sp.get("amountMin")) : undefined,
      amountMax: sp.get("amountMax") ? Number(sp.get("amountMax")) : undefined,
      deadlineBefore: sp.get("deadlineBefore") || undefined,
      deadlineAfter: sp.get("deadlineAfter") || undefined,
      tags: sp.get("tags") || undefined,
      sort: sp.get("sort") || "relevance",
      offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GrantedApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[grants/discover]", error);
    return NextResponse.json({ error: "Grant search failed" }, { status: 500 });
  }
}

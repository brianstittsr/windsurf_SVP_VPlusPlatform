import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/capture/server-auth";
import { searchSamOpportunities } from "@/lib/capture/sam-search";

const schema = z.object({
  keyword: z.string().optional(),
  naicsCode: z.string().optional(),
  setAside: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/** POST /api/capture/sam-search — proxy a SAM.gov opportunity search. */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { keyword, naicsCode, setAside, limit } = parsed.data;
  if (!keyword && !naicsCode && !setAside) {
    return NextResponse.json({ error: "Provide a keyword, NAICS, or set-aside" }, { status: 400 });
  }

  const { notices, error } = await searchSamOpportunities({ keyword, naicsCode, setAside, limit: limit ?? 25 });
  if (error) return NextResponse.json({ error, notices: [] }, { status: 502 });
  return NextResponse.json({ notices });
}

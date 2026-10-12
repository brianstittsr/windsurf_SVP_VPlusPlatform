import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/capture/server-auth";
import { searchAwards } from "@/lib/capture/usaspending";

const searchSchema = z.object({
  awardId: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  naicsCode: z.string().optional(),
  agency: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/** POST /api/usaspending/search — contract award / incumbent lookup. */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const { awardId, keywords, naicsCode, agency, limit } = parsed.data;
  if (!awardId && !keywords?.length && !naicsCode && !agency) {
    return NextResponse.json({ error: "Provide at least one search criterion" }, { status: 400 });
  }

  const { awards, error } = await searchAwards({
    awardId,
    keywords,
    naicsCode,
    agencyCode: agency,
    limit,
  });
  if (error) return NextResponse.json({ error, awards: [] }, { status: 502 });
  return NextResponse.json({ awards });
}

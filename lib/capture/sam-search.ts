/**
 * SAM.gov Contract Opportunities API (v2) client.
 * Public endpoint: https://api.sam.gov/prod/opportunities/v2/search
 * Requires SAM_API_KEY env var (same key as the entity API).
 */

const SAM_OPP_BASE = "https://api.sam.gov/prod/opportunities/v2/search";

export interface SamNotice {
  noticeId: string;
  title?: string;
  solicitationNumber?: string;
  department?: string;
  subTier?: string;
  office?: string;
  type?: string;
  baseType?: string;
  setAside?: string;
  naicsCode?: string;
  classificationCode?: string;
  responseDeadLine?: string;
  postedDate?: string;
  description?: string;
  uiLink?: string;
  archiveDate?: string;
}

interface SamSearchResponse {
  totalRecords?: number;
  opportunitiesData?: SamNotice[];
  error?: string;
  message?: string;
}

export function samApiKey(): string | null {
  return process.env.SAM_API_KEY || null;
}

/** Parse a SAM.gov notice ID out of a URL or raw ID string. */
export function parseNoticeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed;
  const m = trimmed.match(/[?&]id=([a-f0-9]{32})/i) || trimmed.match(/\/view\/([a-f0-9]{32})/i);
  return m ? m[1] : null;
}

/** Search SAM opportunities. Returns null notices list on API failure. */
export async function searchSamOpportunities(params: {
  noticeId?: string;
  keyword?: string;
  naicsCode?: string;
  setAside?: string;
  postedFrom?: string; // MM/dd/yyyy
  postedTo?: string;
  limit?: number;
}): Promise<{ notices: SamNotice[]; error?: string }> {
  const key = samApiKey();
  if (!key) return { notices: [], error: "SAM_API_KEY is not configured" };

  const url = new URL(SAM_OPP_BASE);
  url.searchParams.set("api_key", key);
  url.searchParams.set("limit", String(params.limit ?? 50));
  if (params.noticeId) url.searchParams.set("noticeid", params.noticeId);
  if (params.keyword) url.searchParams.set("q", params.keyword);
  if (params.naicsCode) url.searchParams.set("ncode", params.naicsCode);
  if (params.setAside) url.searchParams.set("setAside", params.setAside);
  if (params.postedFrom) url.searchParams.set("postedFrom", params.postedFrom);
  if (params.postedTo) url.searchParams.set("postedTo", params.postedTo);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      return { notices: [], error: `SAM API error ${res.status}` };
    }
    const data = (await res.json()) as SamSearchResponse;
    return { notices: data.opportunitiesData || [] };
  } catch (e) {
    console.error("[capture] SAM search failed:", e);
    return { notices: [], error: "SAM API request failed" };
  }
}

/** Fetch a single notice's description text (noticedesc endpoint). */
export async function fetchNoticeDescription(noticeId: string): Promise<string | null> {
  const key = samApiKey();
  if (!key) return null;
  try {
    const url = `https://api.sam.gov/prod/opportunities/v2/noticedesc?noticeid=${encodeURIComponent(noticeId)}&api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { description?: string };
    return data.description || null;
  } catch {
    return null;
  }
}

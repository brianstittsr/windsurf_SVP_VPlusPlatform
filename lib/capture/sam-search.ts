/**
 * SAM.gov Contract Opportunities API (v2) client.
 * Endpoint: https://api.sam.gov/opportunities/v2/search
 * Key env var: SAM_API_KEY (SAM_GOV_API_KEY accepted as alias).
 *
 * API notes:
 * - postedFrom/postedTo are REQUIRED (MM/dd/yyyy, max 1-year span)
 * - Keyword search uses `title` (there is no `q` param)
 * - Set-aside filter uses `typeOfSetAside` with SAM codes (8A, HZC, ...)
 * - Response field is `typeOfSetAside`, NOT `setAside`
 */

const SAM_OPP_BASE = "https://api.sam.gov/opportunities/v2/search";

export interface SamNotice {
  noticeId: string;
  title?: string;
  solicitationNumber?: string;
  department?: string;
  subTier?: string;
  office?: string;
  type?: string;
  baseType?: string;
  typeOfSetAside?: string;
  typeOfSetAsideDescription?: string;
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
  return process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY || null;
}

/** Parse a SAM.gov notice ID out of a URL or raw ID string. */
export function parseNoticeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed;
  const m = trimmed.match(/[?&]id=([a-f0-9]{32})/i) || trimmed.match(/\/view\/([a-f0-9]{32})/i);
  return m ? m[1] : null;
}

/** Friendly set-aside keys → SAM typeOfSetAside codes. */
export const SET_ASIDE_SAM_CODES: Record<string, string> = {
  "8a": "8A",
  hubzone: "HZC",
  sdvosb: "SDVOSBC",
  vosb: "VSA",
  wosb: "WOSB",
  edwosb: "EDWOSB",
  sdb: "SDB",
  sba: "SBA",
};

function mmddyyyy(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export interface SamSearchParams {
  noticeId?: string;
  /** Searches the notice title (SAM `title` param). */
  keyword?: string;
  naicsCode?: string;
  /** Friendly key (8a, hubzone, ...) or raw SAM code. */
  setAside?: string;
  /** Procurement type codes, e.g. "o,k,r" — solicitation, combined, sources-sought. */
  ptype?: string;
  /** Lookback window for postedFrom (default 30 days). postedTo is always today. */
  daysBack?: number;
  limit?: number;
}

/** Search SAM opportunities. */
export async function searchSamOpportunities(params: SamSearchParams): Promise<{ notices: SamNotice[]; error?: string }> {
  const key = samApiKey();
  if (!key) return { notices: [], error: "SAM_API_KEY/SAM_GOV_API_KEY is not configured" };

  const postedTo = new Date();
  const postedFrom = new Date(postedTo.getTime() - (params.daysBack ?? 30) * 24 * 60 * 60 * 1000);

  const url = new URL(SAM_OPP_BASE);
  url.searchParams.set("api_key", key);
  url.searchParams.set("limit", String(Math.min(params.limit ?? 50, 1000)));
  url.searchParams.set("postedFrom", mmddyyyy(postedFrom));
  url.searchParams.set("postedTo", mmddyyyy(postedTo));
  if (params.noticeId) url.searchParams.set("noticeid", params.noticeId);
  if (params.keyword) url.searchParams.set("title", params.keyword);
  if (params.naicsCode) url.searchParams.set("ncode", params.naicsCode);
  if (params.setAside) {
    url.searchParams.set("typeOfSetAside", SET_ASIDE_SAM_CODES[params.setAside.toLowerCase()] || params.setAside);
  }
  if (params.ptype) url.searchParams.set("ptype", params.ptype);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { notices: [], error: `SAM API error ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}` };
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
    const url = `https://api.sam.gov/opportunities/v2/noticedesc?noticeid=${encodeURIComponent(noticeId)}&api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { description?: string };
    return data.description || null;
  } catch {
    return null;
  }
}

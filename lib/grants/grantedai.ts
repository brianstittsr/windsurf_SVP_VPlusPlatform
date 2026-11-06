/**
 * GrantedAI Data API client — https://grantedai.com/developers
 * Server-side only. Falls back to the shared anonymous key (published in their
 * docs, 3 AI searches/day per IP) when GRANTED_AI_API_KEY is not configured.
 */

const BASE_URL = "https://grantedai.com";

// Public shared anonymous key from the GrantedAI developer docs — used only as
// a last-resort fallback so the feature works before a real key is configured.
const ANONYMOUS_KEY = "ga_live_c1eee54a9ad8753126b303aeafed3621dd563f67fcc77c74c8b150a028dc42ea";

const TIMEOUT_MS = 20_000;

function apiKey(): string {
  return process.env.GRANTED_AI_API_KEY || ANONYMOUS_KEY;
}

export function usingAnonymousKey(): boolean {
  return !process.env.GRANTED_AI_API_KEY;
}

export class GrantedApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "GrantedApiError";
  }
}

async function grantedFetch<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<{ body: T; headers: Headers }> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey()}`, Accept: "application/json" },
    });
  } catch {
    throw new GrantedApiError(502, "Could not reach GrantedAI");
  } finally {
    clearTimeout(timer);
  }
  const body = (await res.json().catch(() => null)) as T | { error?: { message?: string } } | null;
  if (!res.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message || `GrantedAI returned ${res.status}`;
    throw new GrantedApiError(res.status, message);
  }
  return { body: body as T, headers: res.headers };
}

// ---------------------------------------------------------------------------
// Response types (from GrantedAI docs)
// ---------------------------------------------------------------------------

export interface GrantedDiscoverItem {
  name: string;
  funder?: string;
  slug?: string | null;
  fit_score?: number;
  deadline?: string;
  amount?: string;
  summary?: string;
  eligibility?: string;
  rfp_url?: string | null;
  source_type?: string;
  match_reasons?: string[];
  details_url?: string | null;
}

export interface GrantedDiscoverMeta {
  total?: number;
  cache_hit?: boolean;
  ai_searches_used?: number;
  ai_searches_limit?: number;
  db_only?: boolean;
}

export interface GrantedDbItem {
  id: string;
  name: string;
  slug?: string;
  funder?: string;
  summary?: string;
  amount_min?: number | null;
  amount_max?: number | null;
  deadline?: string | null;
  status?: string;
  state?: string | string[];
  eligibility?: string;
  source_url?: string;
  details_url?: string;
  tags?: Record<string, unknown> | string[];
}

/** Normalized grant result for the Grant Builder UI. */
export interface GrantSearchResult {
  externalId?: string;
  title: string;
  funder?: string;
  summary?: string;
  eligibility?: string;
  awardMin?: number;
  awardMax?: number;
  deadline?: string; // ISO date or display string
  sourceUrl?: string;
  detailsUrl?: string;
  fitScore?: number;
  matchReasons?: string[];
  status?: string;
  state?: string;
}

function parseAmountRange(amount?: string): { awardMin?: number; awardMax?: number } {
  if (!amount) return {};
  const nums = [...amount.matchAll(/([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, "")));
  const valid = nums.filter((n) => Number.isFinite(n) && n > 0);
  if (!valid.length) return {};
  return { awardMin: Math.min(...valid), awardMax: Math.max(...valid) };
}

function normalizeDiscover(item: GrantedDiscoverItem): GrantSearchResult {
  return {
    title: item.name,
    funder: item.funder,
    summary: item.summary,
    eligibility: item.eligibility,
    ...parseAmountRange(item.amount),
    deadline: item.deadline,
    sourceUrl: item.rfp_url || undefined,
    detailsUrl: item.details_url || undefined,
    fitScore: item.fit_score,
    matchReasons: item.match_reasons,
    status: item.source_type,
  };
}

function normalizeDb(item: GrantedDbItem): GrantSearchResult {
  return {
    externalId: item.id,
    title: item.name,
    funder: item.funder,
    summary: item.summary,
    eligibility: item.eligibility,
    awardMin: item.amount_min ?? undefined,
    awardMax: item.amount_max ?? undefined,
    deadline: item.deadline ?? undefined,
    sourceUrl: item.source_url,
    detailsUrl: item.details_url || (item.slug ? `https://grantedai.com/grants/${item.slug}` : undefined),
    status: item.status,
    state: Array.isArray(item.state) ? item.state.join(", ") : item.state,
  };
}

export interface DiscoverParams {
  q: string;
  state?: string;
  source?: string;
  funder?: string;
  orgType?: string;
  includeHistorical?: boolean;
  limit?: number;
}

export interface DiscoverResponse {
  results: GrantSearchResult[];
  meta: GrantedDiscoverMeta;
  rateLimit?: string;
  anonymous: boolean;
}

/** AI-powered grant discovery (natural language). */
export async function discoverGrants(params: DiscoverParams): Promise<DiscoverResponse> {
  const { body, headers } = await grantedFetch<{ data?: GrantedDiscoverItem[]; meta?: GrantedDiscoverMeta }>(
    "/api/v1/discover",
    {
      q: params.q,
      state: params.state,
      source: params.source,
      funder: params.funder,
      org_type: params.orgType,
      include_historical: params.includeHistorical,
      limit: params.limit || 25,
    }
  );
  return {
    results: (body.data || []).map(normalizeDiscover),
    meta: body.meta || {},
    rateLimit: headers.get("x-ratelimit-limit") || undefined,
    anonymous: usingAnonymousKey(),
  };
}

export interface DbSearchParams {
  q?: string;
  status?: string;
  funder?: string;
  state?: string;
  amountMin?: number;
  amountMax?: number;
  deadlineBefore?: string;
  deadlineAfter?: string;
  tags?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface DbSearchResponse {
  results: GrantSearchResult[];
  total: number;
  anonymous: boolean;
}

/** Structured grant database search (no AI cost). */
export async function searchGrantDb(params: DbSearchParams): Promise<DbSearchResponse> {
  const { body } = await grantedFetch<{ data?: GrantedDbItem[]; meta?: { total?: number } }>("/api/v1/grants", {
    q: params.q,
    status: params.status,
    funder: params.funder,
    state: params.state,
    amount_min: params.amountMin,
    amount_max: params.amountMax,
    deadline_before: params.deadlineBefore,
    deadline_after: params.deadlineAfter,
    tags: params.tags,
    offset: params.offset,
    limit: params.limit || 25,
    sort: params.sort,
  });
  return {
    results: (body.data || []).map(normalizeDb),
    total: body.meta?.total || 0,
    anonymous: usingAnonymousKey(),
  };
}

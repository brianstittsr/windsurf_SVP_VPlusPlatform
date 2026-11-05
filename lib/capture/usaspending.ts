/**
 * USAspending.gov public API (v2) — no API key required.
 * Used for incumbent lookup: find recent contract awards by PIID/keywords.
 */

const BASE = "https://api.usaspending.gov/api/v2";

const CONTRACT_TYPES = ["A", "B", "C", "D"]; // definitive contracts, POs, delivery orders, IDVs? A-D = contracts/orders

const FIELDS = [
  "Award ID",
  "Recipient Name",
  "Start Date",
  "End Date",
  "Award Amount",
  "Awarding Agency",
  "Awarding Sub Agency",
  "Contract Award Type",
  "NAICS",
  "def_codes",
];

export interface UsaSpendingAward {
  awardId: string;
  recipient: string;
  amount: number | null;
  startDate: string | null;
  endDate: string | null;
  agency: string;
  subAgency?: string;
  naics?: string;
}

interface SpendingRow {
  "Award ID"?: string;
  "Recipient Name"?: string;
  "Start Date"?: string;
  "End Date"?: string;
  "Award Amount"?: number;
  "Awarding Agency"?: string;
  "Awarding Sub Agency"?: string;
  NAICS?: { code?: string; description?: string } | string;
}

/** Search contract awards. All params optional; at least one narrows the query. */
export async function searchAwards(params: {
  awardId?: string;
  keywords?: string[];
  naicsCode?: string;
  agencyCode?: string;
  limit?: number;
}): Promise<{ awards: UsaSpendingAward[]; error?: string }> {
  const filters: Record<string, unknown> = {
    award_type_codes: CONTRACT_TYPES,
    time_period: [{ start_date: "2018-01-01", end_date: new Date().toISOString().slice(0, 10) }],
  };
  if (params.awardId) filters.award_ids = [params.awardId];
  if (params.keywords?.length) filters.keywords = params.keywords;
  if (params.naicsCode) filters.naics_codes = { require: [params.naicsCode] };
  if (params.agencyCode) {
    filters.agencies = [{ type: "awarding", tier: "toptier", name: params.agencyCode }];
  }

  try {
    const res = await fetch(`${BASE}/search/spending_by_award/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters,
        fields: FIELDS,
        limit: params.limit ?? 25,
        page: 1,
        sort: "Start Date",
        order: "desc",
      }),
    });
    if (!res.ok) return { awards: [], error: `USAspending API error ${res.status}` };
    const data = (await res.json()) as { results?: SpendingRow[] };
    const awards = (data.results || []).map((r) => ({
      awardId: r["Award ID"] || "",
      recipient: r["Recipient Name"] || "",
      amount: r["Award Amount"] ?? null,
      startDate: r["Start Date"] || null,
      endDate: r["End Date"] || null,
      agency: r["Awarding Agency"] || r["Awarding Sub Agency"] || "",
      subAgency: r["Awarding Sub Agency"],
      naics: typeof r.NAICS === "object" ? r.NAICS?.code : r.NAICS,
    }));
    return { awards };
  } catch (e) {
    console.error("[usaspending] search failed:", e);
    return { awards: [], error: "USAspending request failed" };
  }
}

import type { CaptureMatchDoc, CaptureSettingsDoc, CustomerDoc } from "@/lib/schema";

export interface MatchInput {
  naicsCode?: string;
  setAside?: string;
  agency?: string;
  office?: string;
  title?: string;
  description?: string;
  pscCode?: string;
  estimatedValue?: number;
}

export interface MatchResult {
  score: number;
  breakdown: { factor: string; points: number; max: number }[];
}

/** Normalize set-aside strings for comparison (e.g. "8(a)" → "8a"). */
function normSetAside(s?: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const CERT_ALIASES: Record<string, string[]> = {
  "8a": ["8a", "8(a)"],
  hubzone: ["hubzone", "hub zone"],
  sdvosb: ["sdvosb", "sd-vosb"],
  vosb: ["vosb"],
  wosb: ["wosb"],
  edwosb: ["edwosb"],
  mbe: ["mbe"],
  dbw: ["dbw", "dbe"],
};

function clientHasCert(client: CustomerDoc, setAside: string): boolean {
  const target = normSetAside(setAside);
  const aliases = CERT_ALIASES[target] || [target];
  return (client.govcon?.certifications || []).some((c) =>
    aliases.includes(normSetAside(c.name))
  );
}

/**
 * Score a SAM notice / opportunity draft against a client's govcon profile.
 * Weights come from capture settings (sum should be ~100).
 */
export function scoreMatch(notice: MatchInput, client: CustomerDoc, settings: CaptureSettingsDoc): MatchResult {
  const w = settings.matchWeights;
  const g = client.govcon || {};
  const breakdown: MatchResult["breakdown"] = [];

  // NAICS match
  const naics = (notice.naicsCode || "").trim();
  const naicsHit = !!naics && (g.naicsCodes || []).some((n) => n.trim() === naics || naics.startsWith(n.trim()));
  breakdown.push({ factor: "NAICS match", points: naicsHit ? w.naics : 0, max: w.naics });

  // Set-aside eligibility — full points for unrestricted, matching cert, or no set-aside
  let saPoints = w.setAside;
  const sa = (notice.setAside || "").trim();
  if (sa && !["unrestricted", "none", "fullandopen", "full and open"].includes(normSetAside(sa))) {
    saPoints = clientHasCert(client, sa) ? w.setAside : 0;
  }
  breakdown.push({ factor: "Set-aside eligibility", points: saPoints, max: w.setAside });

  // Keyword overlap in title + description vs client keywords
  const haystack = `${notice.title || ""} ${notice.description || ""}`.toLowerCase();
  const kws = (g.keywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean);
  const kwHits = kws.filter((k) => haystack.includes(k)).length;
  const kwRatio = kws.length ? Math.min(1, kwHits / Math.max(1, Math.ceil(kws.length / 3))) : 0;
  breakdown.push({ factor: "Keyword overlap", points: Math.round(w.keywords * kwRatio), max: w.keywords });

  // PSC code presence
  breakdown.push({ factor: "PSC code", points: notice.pscCode ? w.psc : 0, max: w.psc });

  // Target agency match
  const agencyHay = `${notice.agency || ""} ${notice.office || ""}`.toLowerCase();
  const agencyHit = (g.targetAgencies || []).some((a) => a && agencyHay.includes(a.toLowerCase()));
  breakdown.push({ factor: "Target agency", points: agencyHit ? w.agency : 0, max: w.agency });

  // Estimated value / clearance presence
  const valPts = notice.estimatedValue && notice.estimatedValue > 0 ? w.value : w.value / 2;
  breakdown.push({ factor: "Estimated value", points: Math.round(valPts), max: w.value });

  return { score: breakdown.reduce((s, b) => s + b.points, 0), breakdown };
}

/** Whether a score meets the queue cutoff. */
export function meetsCutoff(score: number, settings: CaptureSettingsDoc): boolean {
  return score >= settings.matchScoreCutoff;
}

export type { CaptureMatchDoc };

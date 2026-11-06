"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureJson } from "@/lib/capture/api-client";
import type { GrantSearchResult } from "@/lib/grants/grantedai";
import { Check, ExternalLink, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

interface AiSearchMeta {
  ai_searches_used?: number;
  ai_searches_limit?: number;
  db_only?: boolean;
  cache_hit?: boolean;
}

export function GrantedSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<"ai" | "db">("ai");
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [source, setSource] = useState("");
  const [orgType, setOrgType] = useState("");
  const [funder, setFunder] = useState("");
  const [status, setStatus] = useState("active");
  const [results, setResults] = useState<GrantSearchResult[]>([]);
  const [meta, setMeta] = useState<AiSearchMeta | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Record<string, string>>({});

  const search = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ mode });
      if (q.trim()) params.set("q", q.trim());
      if (state) params.set("state", state);
      if (mode === "ai") {
        if (source) params.set("source", source);
        if (orgType) params.set("orgType", orgType);
        if (funder.trim()) params.set("funder", funder.trim());
      } else {
        if (funder.trim()) params.set("funder", funder.trim());
        params.set("status", status);
      }
      const data = await captureJson<{ results: GrantSearchResult[]; meta?: AiSearchMeta; total?: number; anonymous?: boolean }>(
        `/api/grants/discover?${params}`
      );
      setResults(data.results);
      setMeta(data.meta || null);
      setTotal(data.total ?? null);
      setAnonymous(data.anonymous === true);
      if (!data.results.length) toast.info("No grants matched — try a broader query");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const importGrant = async (r: GrantSearchResult) => {
    const key = r.sourceUrl || r.title;
    setImporting(key);
    try {
      const data = await captureJson<{ grant: { id: string }; alreadyImported?: boolean; analyzeError?: string }>(
        "/api/grants/import",
        {
          method: "POST",
          body: JSON.stringify({
            title: r.title,
            funder: r.funder,
            summary: r.summary,
            eligibility: r.eligibility,
            awardMin: r.awardMin,
            awardMax: r.awardMax,
            deadline: r.deadline,
            sourceUrl: r.sourceUrl,
            detailsUrl: r.detailsUrl,
            analyze: true,
          }),
        }
      );
      setImported((prev) => ({ ...prev, [key]: data.grant.id }));
      if (data.alreadyImported) {
        toast.info("Already on your board");
      } else if (data.analyzeError) {
        toast.warning("Imported — page analysis failed, grant added without extracted questions");
      } else {
        toast.success("Imported and analyzed");
      }
      router.push(`/portal/grants/${data.grant.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex border rounded-md overflow-hidden shrink-0">
              <Button variant={mode === "ai" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("ai")}>
                <Sparkles className="h-4 w-4 mr-1" /> AI Discovery
              </Button>
              <Button variant={mode === "db" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("db")}>
                Database
              </Button>
            </div>
            <Input
              placeholder={mode === "ai" ? "e.g. rural mental health grants for nonprofits" : "Keyword search"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search} disabled={searching || (mode === "ai" && q.trim().length < 3)}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Select value={state || "all"} onValueChange={(v) => setState(v === "all" ? "" : v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mode === "ai" ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Source</Label>
                  <Select value={source || "all"} onValueChange={(v) => setSource(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="federal">Federal</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Org type</Label>
                  <Select value={orgType || "all"} onValueChange={(v) => setOrgType(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="Nonprofit">Nonprofit</SelectItem>
                      <SelectItem value="Small Business">Small Business</SelectItem>
                      <SelectItem value="University">University</SelectItem>
                      <SelectItem value="Tribal">Tribal</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="forecasted">Forecasted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Funder</Label>
              <Input className="h-8" placeholder="Any" value={funder} onChange={(e) => setFunder(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {anonymous && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-md px-3 py-2">
          Using the shared anonymous GrantedAI key (3 AI searches/day). Set <code>GRANTED_AI_API_KEY</code> for higher limits — free at grantedai.com/developers.
        </p>
      )}
      {meta && mode === "ai" && (
        <p className="text-xs text-muted-foreground">
          {meta.db_only
            ? "AI search limit reached — showing database results only."
            : `AI searches used today: ${meta.ai_searches_used ?? "?"}/${meta.ai_searches_limit ?? "?"}`}
          {meta.cache_hit ? " (cached)" : ""}
        </p>
      )}
      {total !== null && mode === "db" && (
        <p className="text-xs text-muted-foreground">{total.toLocaleString()} grants matched (showing {results.length})</p>
      )}

      <div className="space-y-2">
        {results.map((r, i) => {
          const key = r.sourceUrl || r.title;
          const importedId = imported[key];
          return (
            <Card key={`${key}-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium leading-tight">{r.title}</p>
                      {r.fitScore !== undefined && (
                        <Badge variant={r.fitScore >= 70 ? "default" : "secondary"}>{r.fitScore}% fit</Badge>
                      )}
                      {r.status && <Badge variant="outline" className="capitalize">{r.status}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.funder || "Unknown funder"}</p>
                    {r.summary && <p className="text-sm text-muted-foreground line-clamp-2">{r.summary}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap pt-1">
                      {r.deadline && <span>Deadline: {r.deadline}</span>}
                      {(r.awardMax || r.awardMin) && (
                        <span>
                          Award: {r.awardMin ? `$${r.awardMin.toLocaleString()}` : "—"} – {r.awardMax ? `$${r.awardMax.toLocaleString()}` : "—"}
                        </span>
                      )}
                      {r.state && <span>{r.state}</span>}
                    </div>
                    {r.matchReasons && r.matchReasons.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {r.matchReasons.slice(0, 3).map((reason, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{reason}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" onClick={() => importGrant(r)} disabled={importing !== null || !!importedId}>
                      {importing === key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : importedId ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        "Import"
                      )}
                    </Button>
                    <div className="flex gap-1">
                      {r.detailsUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={r.detailsUrl} target="_blank" rel="noreferrer" title="GrantedAI details">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {importedId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/portal/grants/${importedId}`}>Open</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

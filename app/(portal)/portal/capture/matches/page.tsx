"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { captureJson } from "@/lib/capture/api-client";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { CaptureMatch, CaptureSavedSearch } from "@/lib/schema";
import { Check, ExternalLink, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type MatchRow = CaptureMatch & { opportunityId?: string };

export default function MatchesPage() {
  const { profile } = useUserProfile();
  const isAdmin = profile.role === "admin";
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [searches, setSearches] = useState<CaptureSavedSearch[]>([]);
  const [status, setStatus] = useState("pending");
  const [running, setRunning] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [newSearch, setNewSearch] = useState({ name: "", query: "", naicsCode: "", setAside: "" });

  const load = useCallback(() => {
    captureJson<{ matches: MatchRow[] }>(`/api/capture/match?status=${status}`)
      .then((d) => setMatches(d.matches))
      .catch((e) => toast.error(e.message));
    captureJson<{ searches: CaptureSavedSearch[] }>("/api/capture/searches")
      .then((d) => setSearches(d.searches))
      .catch((e) => toast.error(e.message));
  }, [status]);

  useEffect(load, [load]);

  const act = async (m: MatchRow, action: "accept" | "dismiss") => {
    setActioning(m.id);
    try {
      const res = await captureJson<{ status: string; opportunityId?: string }>(
        `/api/capture/match/${m.id}`,
        { method: "POST", body: JSON.stringify({ action }) }
      );
      toast.success(action === "accept" ? "Accepted — opportunity created" : "Dismissed");
      if (res.opportunityId) {
        window.location.href = `/portal/capture/opportunities/${res.opportunityId}`;
        return;
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActioning(null);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await captureJson<{ notices: number; matches: number; errors?: string[] }>(
        "/api/capture/match/run",
        { method: "POST" }
      );
      toast.success(`Scan complete: ${res.notices} notices, ${res.matches} new match(es)`);
      if (res.errors?.length) toast.warning(res.errors.join("; "));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Match run failed");
    } finally {
      setRunning(false);
    }
  };

  const addSearch = async () => {
    if (!newSearch.name.trim()) return;
    try {
      await captureJson("/api/capture/searches", {
        method: "POST",
        body: JSON.stringify({
          name: newSearch.name,
          query: newSearch.query || undefined,
          naicsCode: newSearch.naicsCode || undefined,
          setAside: newSearch.setAside || undefined,
          isActive: true,
        }),
      });
      setNewSearch({ name: "", query: "", naicsCode: "", setAside: "" });
      toast.success("Search saved");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const toggleSearch = async (s: CaptureSavedSearch) => {
    try {
      await captureJson(`/api/capture/searches/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const deleteSearch = async (s: CaptureSavedSearch) => {
    try {
      await captureJson(`/api/capture/searches/${s.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Match Queue</h1>
          <p className="text-sm text-muted-foreground">
            SAM.gov notices scored against your clients&apos; GovCon profiles (runs every 6 hours).
          </p>
        </div>
        {isAdmin && (
          <Button onClick={runNow} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
            {running ? "Scanning SAM.gov..." : "Run Matching Now"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Saved Searches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {searches.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No saved searches — add one below; the 6-hourly job only scans active searches.
            </p>
          )}
          {searches.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
              <div className="flex items-center gap-3 min-w-0">
                <Switch checked={s.isActive} onCheckedChange={() => toggleSearch(s)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[s.query && `“${s.query}”`, s.naicsCode && `NAICS ${s.naicsCode}`, s.setAside]
                      .filter(Boolean)
                      .join(" · ") || "All notices"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteSearch(s)} aria-label="Delete search">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1">
            <div className="col-span-2 md:col-span-1 space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={newSearch.name} onChange={(e) => setNewSearch((s) => ({ ...s, name: e.target.value }))} placeholder="IT services" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Keyword</Label>
              <Input value={newSearch.query} onChange={(e) => setNewSearch((s) => ({ ...s, query: e.target.value }))} placeholder="cybersecurity" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NAICS</Label>
              <Input value={newSearch.naicsCode} onChange={(e) => setNewSearch((s) => ({ ...s, naicsCode: e.target.value }))} placeholder="541512" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Set-aside</Label>
              <Input value={newSearch.setAside} onChange={(e) => setNewSearch((s) => ({ ...s, setAside: e.target.value }))} placeholder="8A" />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={addSearch} disabled={!newSearch.name.trim()} className="w-full">
                Add Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>
        <TabsContent value={status} className="space-y-3 pt-4">
          {matches.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No {status} matches.</p>
          )}
          {matches.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium leading-tight">{m.title}</p>
                    <Badge variant={m.score >= 80 ? "default" : "secondary"}>{m.score}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.clientName}
                    {m.solicitationNumber ? ` · ${m.solicitationNumber}` : ""}
                    {m.agency ? ` · ${m.agency}` : ""}
                    {m.responseDeadline ? ` · due ${new Date(m.responseDeadline).toLocaleDateString()}` : ""}
                  </p>
                  {m.scoreBreakdown && m.scoreBreakdown.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {m.scoreBreakdown.map((b) => `${b.factor}: ${b.points}/${b.max}`).join(" · ")}
                    </p>
                  )}
                  {m.samUrl && (
                    <a href={m.samUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1">
                      View on SAM.gov <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => act(m, "accept")} disabled={actioning === m.id}>
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(m, "dismiss")} disabled={actioning === m.id}>
                      <X className="h-4 w-4 mr-1" /> Dismiss
                    </Button>
                  </div>
                )}
                {status === "accepted" && m.opportunityId && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/portal/capture/opportunities/${m.opportunityId}`}>
                      Open
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientPicker } from "@/components/capture/client-picker";
import { MemberPicker, type CaptureMember } from "@/components/capture/member-picker";
import { captureJson } from "@/lib/capture/api-client";
import type { SamNotice } from "@/lib/capture/sam-search";
import { ArrowUpRight, BookmarkPlus, ExternalLink, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SavedNotice {
  id: string;
  noticeId: string;
  title?: string;
  solicitationNumber?: string;
  agency?: string;
  office?: string;
  setAside?: string;
  naicsCode?: string;
  responseDeadline?: string;
  samUrl?: string;
  savedAt?: string;
  status?: string;
}

interface PromoteTarget {
  savedId?: string;
  noticeId: string;
  title: string;
}

export default function SolicitationsPage() {
  const [saved, setSaved] = useState<SavedNotice[]>([]);
  const [results, setResults] = useState<SamNotice[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState({ keyword: "", naicsCode: "", setAside: "" });
  const [promoting, setPromoting] = useState<PromoteTarget | null>(null);
  const [clientId, setClientId] = useState("");
  const [owner, setOwner] = useState<{ id: string; name: string }>({ id: "", name: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    captureJson<{ solicitations: SavedNotice[] }>("/api/capture/solicitations")
      .then((d) => setSaved(d.solicitations))
      .catch((e) => toast.error(e.message));
  }, []);
  useEffect(load, [load]);

  const search = async () => {
    setSearching(true);
    try {
      const { notices } = await captureJson<{ notices: SamNotice[] }>("/api/capture/sam-search", {
        method: "POST",
        body: JSON.stringify({
          keyword: filters.keyword || undefined,
          naicsCode: filters.naicsCode || undefined,
          setAside: filters.setAside || undefined,
        }),
      });
      setResults(notices);
      setSearched(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const saveNotice = async (n: SamNotice) => {
    try {
      await captureJson("/api/capture/solicitations", {
        method: "POST",
        body: JSON.stringify({
          noticeId: n.noticeId,
          title: n.title,
          solicitationNumber: n.solicitationNumber,
          agency: n.department || n.subTier,
          office: n.office,
          type: n.type,
          setAside: n.setAside,
          naicsCode: n.naicsCode,
          responseDeadline: n.responseDeadLine,
          samUrl: n.uiLink || `https://sam.gov/opp/${n.noticeId}/view`,
        }),
      });
      toast.success("Saved to inbox");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const removeSaved = async (id: string) => {
    try {
      await captureJson(`/api/capture/solicitations/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const promote = async () => {
    if (!promoting || !clientId) return;
    setBusy(true);
    try {
      const { opportunity } = await captureJson<{ opportunity: { id: string } }>(
        "/api/capture/promote",
        {
          method: "POST",
          body: JSON.stringify({
            samSavedOpportunityId: promoting.savedId,
            samNoticeId: promoting.savedId ? undefined : promoting.noticeId,
            clientId,
            ownerId: owner.id || undefined,
            ownerName: owner.name || undefined,
          }),
        }
      );
      toast.success("Promoted to the capture board");
      window.location.href = `/portal/capture/opportunities/${opportunity.id}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Promote failed");
    } finally {
      setBusy(false);
    }
  };

  const renderNotice = (
    key: string,
    title: string,
    meta: { solicitation?: string; agency?: string; setAside?: string; naics?: string; due?: string; url?: string },
    actions: ReactNode
  ) => (
    <Card key={key}>
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="font-medium leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">
            {[meta.solicitation, meta.agency, meta.setAside && <Badge key="sa" variant="secondary" className="mr-1">{meta.setAside}</Badge>, meta.naics && `NAICS ${meta.naics}`]
              .filter(Boolean)
              .map((x, i) => <span key={i}>{typeof x === "string" ? x : x}{i < 3 ? " · " : ""}</span>)}
            {meta.due && ` · due ${new Date(meta.due).toLocaleDateString()}`}
          </p>
          {meta.url && (
            <a href={meta.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1">
              SAM.gov <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex gap-2 shrink-0">{actions}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SAM Notices</h1>
        <p className="text-sm text-muted-foreground">
          Intake inbox — search SAM.gov, save notices, promote them to the capture board.
        </p>
      </div>

      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
          <TabsTrigger value="search">Search SAM.gov</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-3 pt-4">
          {saved.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nothing saved yet — search SAM.gov and bookmark notices here.
            </p>
          )}
          {saved.map((n) =>
            renderNotice(
              n.id,
              n.title || n.solicitationNumber || n.noticeId,
              {
                solicitation: n.solicitationNumber,
                agency: n.agency,
                setAside: n.setAside,
                naics: n.naicsCode,
                due: n.responseDeadline,
                url: n.samUrl,
              },
              <>
                <Button
                  size="sm"
                  onClick={() => setPromoting({ savedId: n.id, noticeId: n.noticeId, title: n.title || n.noticeId })}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" /> Promote
                </Button>
                <Button size="sm" variant="outline" onClick={() => removeSaved(n.id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-3 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Keyword</Label>
              <Input value={filters.keyword} onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))} placeholder="cybersecurity" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NAICS</Label>
              <Input value={filters.naicsCode} onChange={(e) => setFilters((f) => ({ ...f, naicsCode: e.target.value }))} placeholder="541512" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Set-aside</Label>
              <Input value={filters.setAside} onChange={(e) => setFilters((f) => ({ ...f, setAside: e.target.value }))} placeholder="8A" />
            </div>
            <div className="flex items-end">
              <Button onClick={search} disabled={searching || (!filters.keyword && !filters.naicsCode && !filters.setAside)} className="w-full">
                <Search className="h-4 w-4 mr-1" />
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {searched && results.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No notices found.</p>
          )}
          {results.map((n) =>
            renderNotice(
              n.noticeId,
              n.title || n.solicitationNumber || n.noticeId,
              {
                solicitation: n.solicitationNumber,
                agency: n.department || n.subTier,
                setAside: n.setAside,
                naics: n.naicsCode,
                due: n.responseDeadLine,
                url: n.uiLink || `https://sam.gov/opp/${n.noticeId}/view`,
              },
              <>
                <Button size="sm" onClick={() => setPromoting({ noticeId: n.noticeId, title: n.title || n.noticeId })}>
                  <ArrowUpRight className="h-4 w-4 mr-1" /> Promote
                </Button>
                <Button size="sm" variant="outline" onClick={() => saveNotice(n)}>
                  <BookmarkPlus className="h-4 w-4 mr-1" /> Save
                </Button>
              </>
            )
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!promoting} onOpenChange={(o) => !o && setPromoting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Capture Board</DialogTitle>
            <DialogDescription>
              Create an opportunity for &quot;{promoting?.title}&quot; linked to a client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <ClientPicker value={clientId} onChange={setClientId} />
            </div>
            <div className="space-y-2">
              <Label>Owner (optional)</Label>
              <MemberPicker
                value={owner.id}
                onChange={(id, m?: CaptureMember) => setOwner({ id, name: m?.name || "" })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={promote} disabled={!clientId || busy}>
              {busy ? "Creating..." : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

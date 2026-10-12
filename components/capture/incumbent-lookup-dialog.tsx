"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureJson } from "@/lib/capture/api-client";
import type { UsaSpendingAward } from "@/lib/capture/usaspending";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitationNumber?: string;
  agency?: string;
  naicsCode?: string;
  onSelect: (incumbentName: string) => void;
}

/** Look up likely incumbents on USAspending by PIID / keywords / NAICS. */
export function IncumbentLookupDialog({ open, onOpenChange, solicitationNumber, agency, naicsCode, onSelect }: Props) {
  const [awardId, setAwardId] = useState(solicitationNumber || "");
  const [keyword, setKeyword] = useState(agency || "");
  const [results, setResults] = useState<UsaSpendingAward[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(false);
    try {
      const { awards } = await captureJson<{ awards: UsaSpendingAward[] }>("/api/usaspending/search", {
        method: "POST",
        body: JSON.stringify({
          awardId: awardId.trim() || undefined,
          keywords: keyword.trim() ? [keyword.trim()] : undefined,
          naicsCode: naicsCode || undefined,
          limit: 25,
        }),
      });
      setResults(awards);
      setSearched(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incumbent Lookup — USAspending</DialogTitle>
          <DialogDescription>
            Search recent federal contract awards to identify likely incumbents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prior award / PIID</Label>
              <Input value={awardId} onChange={(e) => setAwardId(e.target.value)} placeholder="e.g. GS00F0000" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Agency / keyword</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. Navy" />
            </div>
          </div>
          <Button size="sm" onClick={search} disabled={loading || (!awardId.trim() && !keyword.trim())}>
            <Search className="h-4 w-4 mr-1" />
            {loading ? "Searching..." : "Search USAspending"}
          </Button>

          {searched && results.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No contract awards found.</p>
          )}
          {results.length > 0 && (
            <div className="divide-y rounded-md border">
              {results.map((r, i) => (
                <div key={`${r.awardId}-${i}`} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.recipient || "Unknown recipient"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.awardId}
                      {r.amount != null && ` · $${r.amount.toLocaleString()}`}
                      {r.endDate && ` · ends ${r.endDate.slice(0, 10)}`}
                      {r.naics && ` · NAICS ${r.naics}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{r.subAgency || r.agency}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      onSelect(r.recipient);
                      onOpenChange(false);
                    }}
                  >
                    Set Incumbent
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

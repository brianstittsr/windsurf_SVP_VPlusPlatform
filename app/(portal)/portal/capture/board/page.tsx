"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaptureBoard } from "@/components/capture/capture-board";
import { ClientPicker } from "@/components/capture/client-picker";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity, CaptureSettingsDoc } from "@/lib/schema";
import { Plus } from "lucide-react";

export default function CaptureBoardPage() {
  const [opps, setOpps] = useState<CaptureOpportunity[]>([]);
  const [settings, setSettings] = useState<CaptureSettingsDoc | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [boardType, setBoardType] = useState("standard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (clientFilter) params.set("clientId", clientFilter);
    Promise.all([
      captureJson<{ opportunities: CaptureOpportunity[] }>(`/api/capture/opportunities?${params}`),
      captureJson<{ settings: CaptureSettingsDoc }>("/api/capture/settings"),
    ])
      .then(([o, s]) => {
        setOpps(o.opportunities);
        setSettings(s.settings);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [clientFilter]);

  if (loading || !settings) return <div className="p-6 text-muted-foreground">Loading board...</div>;

  const filtered = opps.filter((o) => (o.boardType || "standard") === boardType);

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Pipeline Board</h1>
        <div className="flex items-center gap-3">
          <ClientPicker value={clientFilter} onChange={setClientFilter} placeholder="All clients" />
          {clientFilter && (
            <Button variant="ghost" size="sm" onClick={() => setClientFilter("")}>
              Clear
            </Button>
          )}
          <Select value={boardType} onValueChange={setBoardType}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Board</SelectItem>
              <SelectItem value="rfi">RFI Board</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild size="sm">
            <Link href="/portal/capture/opportunities/new">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Link>
          </Button>
        </div>
      </div>

      <CaptureBoard
        opportunities={filtered}
        settings={settings}
        boardType={boardType}
        onUpdated={(u) => setOpps((prev) => prev.map((o) => (o.id === u.id ? u : o)))}
      />
    </div>
  );
}

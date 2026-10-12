"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeadlineChip } from "@/components/capture/deadline-chip";
import { StageBadge } from "@/components/capture/stage-badge";
import { ClientPicker } from "@/components/capture/client-picker";
import { ExportButton } from "@/components/capture/export-button";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity, CaptureSettingsDoc } from "@/lib/schema";
import { stagesForBoard } from "@/lib/capture/stages";

export default function CaptureTablePage() {
  const [opps, setOpps] = useState<CaptureOpportunity[]>([]);
  const [settings, setSettings] = useState<CaptureSettingsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ clientId: "", stage: "", type: "" });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.clientId) params.set("clientId", filters.clientId);
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.type) params.set("type", filters.type);
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
  }, [filters]);

  const allStages = useMemo(() => stagesForBoard("standard"), []);
  const hasFilters = !!(filters.clientId || filters.stage || filters.type);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <ClientPicker value={filters.clientId} onChange={(v) => setFilters((f) => ({ ...f, clientId: v }))} placeholder="All clients" />
          <Select value={filters.stage} onValueChange={(v) => setFilters((f) => ({ ...f, stage: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              {allStages.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {(settings?.opportunityTypes || []).map((t) => (
                <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ clientId: "", stage: "", type: "" })}>
              Clear
            </Button>
          )}
          <ExportButton filters={filters} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Solicitation #</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Questions Due</TableHead>
                <TableHead>Response Due</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                </TableRow>
              ) : opps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No opportunities match.
                  </TableCell>
                </TableRow>
              ) : (
                opps.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/portal/capture/opportunities/${o.id}`} className="font-medium hover:underline">
                        {o.title}
                      </Link>
                    </TableCell>
                    <TableCell>{o.clientName}</TableCell>
                    <TableCell>{o.solicitationNumber}</TableCell>
                    <TableCell>{o.agency}</TableCell>
                    <TableCell><StageBadge boardType={o.boardType} stage={o.stage} /></TableCell>
                    <TableCell>
                      <DeadlineChip
                        deadline={o.questionsDue}
                        yellowDays={settings?.deadlineYellowDays}
                        redDays={settings?.deadlineRedDays}
                      />
                    </TableCell>
                    <TableCell>
                      <DeadlineChip
                        deadline={o.responseDue}
                        yellowDays={settings?.deadlineYellowDays}
                        redDays={settings?.deadlineRedDays}
                      />
                    </TableCell>
                    <TableCell>{o.ownerName || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

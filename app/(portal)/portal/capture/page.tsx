"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeadlineChip } from "@/components/capture/deadline-chip";
import { StageBadge } from "@/components/capture/stage-badge";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity, CaptureSettingsDoc, CustomerDoc } from "@/lib/schema";
import { daysUntilDeadline, deadlineStatus } from "@/lib/capture/deadline-status";
import { Briefcase, Users, Clock, AlertTriangle, Trophy, Plus } from "lucide-react";

export default function CaptureDashboardPage() {
  const [opps, setOpps] = useState<CaptureOpportunity[]>([]);
  const [clients, setClients] = useState<CustomerDoc[]>([]);
  const [settings, setSettings] = useState<CaptureSettingsDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      captureJson<{ opportunities: CaptureOpportunity[] }>("/api/capture/opportunities"),
      captureJson<{ clients: CustomerDoc[] }>("/api/capture/clients"),
      captureJson<{ settings: CaptureSettingsDoc }>("/api/capture/settings"),
    ])
      .then(([o, c, s]) => {
        setOpps(o.opportunities);
        setClients(c.clients);
        setSettings(s.settings);
      })
      .catch((e) => console.error("Dashboard load failed:", e))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const yd = settings?.deadlineYellowDays ?? 7;
    const rd = settings?.deadlineRedDays ?? 3;
    const open = opps.filter((o) => !["won", "lost", "closed"].includes(o.stage));
    return {
      clients: clients.length,
      open: open.length,
      won: opps.filter((o) => o.stage === "won").length,
      dueSoon: open.filter(
        (o) =>
          ["yellow", "red"].includes(deadlineStatus(o.responseDue, yd, rd)) ||
          ["yellow", "red"].includes(deadlineStatus(o.questionsDue, yd, rd))
      ).length,
      overdue: open.filter(
        (o) =>
          deadlineStatus(o.responseDue, yd, rd) === "overdue" ||
          deadlineStatus(o.questionsDue, yd, rd) === "overdue"
      ).length,
    };
  }, [opps, clients, settings]);

  const upcoming = useMemo(() => {
    const rd = settings?.deadlineRedDays ?? 3;
    return opps
      .filter((o) => !["won", "lost", "closed"].includes(o.stage) && o.responseDue?.at)
      .map((o) => ({ opp: o, days: daysUntilDeadline(o.responseDue) }))
      .filter((x): x is { opp: CaptureOpportunity; days: number } => x.days !== null && x.days <= 30)
      .sort((a, b) => a.days - b.days)
      .slice(0, 10)
      .map((x) => ({ ...x, isRed: x.days <= rd }));
  }, [opps, settings]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading capture dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Capture Management</h1>
          <p className="text-sm text-muted-foreground">GovCon business development pipeline</p>
        </div>
        <Button asChild>
          <Link href="/portal/capture/opportunities/new">
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Clients", value: stats.clients, icon: Users },
          { label: "Open Opportunities", value: stats.open, icon: Briefcase },
          { label: "Due in 7 Days", value: stats.dueSoon, icon: Clock },
          { label: "Overdue", value: stats.overdue, icon: AlertTriangle, red: true },
          { label: "Won", value: stats.won, icon: Trophy },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.red ? "text-red-600" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.red && s.value > 0 ? "text-red-600" : ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Response Deadlines (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines in the next 30 days.</p>
          ) : (
            <div className="divide-y">
              {upcoming.map(({ opp, days }) => (
                <Link
                  key={opp.id}
                  href={`/portal/capture/opportunities/${opp.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{opp.title}</p>
                    <p className="text-xs text-muted-foreground">{opp.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StageBadge boardType={opp.boardType} stage={opp.stage} />
                    {settings && (
                      <DeadlineChip
                        deadline={opp.responseDue}
                        yellowDays={settings.deadlineYellowDays}
                        redDays={settings.deadlineRedDays}
                      />
                    )}
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {days < 0 ? `${-days}d late` : `${days}d`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

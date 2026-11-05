"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity } from "@/lib/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalItem {
  opp: CaptureOpportunity;
  kind: "questions" | "response";
  date: Date;
}

export default function CaptureCalendarPage() {
  const [opps, setOpps] = useState<CaptureOpportunity[]>([]);
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    captureJson<{ opportunities: CaptureOpportunity[] }>("/api/capture/opportunities")
      .then((d) => setOpps(d.opportunities))
      .catch((e) => console.error(e));
  }, []);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const o of opps) {
      if (["won", "lost", "closed"].includes(o.stage)) continue;
      for (const kind of ["questions", "response"] as const) {
        const dl = kind === "questions" ? o.questionsDue : o.responseDue;
        if (!dl?.at) continue;
        const d = new Date(dl.at);
        if (Number.isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const list = map.get(key) || [];
        list.push({ opp: o, kind, date: d });
        map.set(key, list);
      }
    }
    return map;
  }, [opps]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deadlines Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium w-40 text-center">
            {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="bg-muted/30 min-h-24" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const items = itemsByDay.get(`${year}-${month}-${day}`) || [];
              return (
                <div key={day} className={`bg-background min-h-24 p-1.5 ${isToday(day) ? "ring-2 ring-primary ring-inset" : ""}`}>
                  <p className="text-xs text-muted-foreground mb-1">{day}</p>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item, j) => (
                      <Link key={`${item.opp.id}-${item.kind}-${j}`} href={`/portal/capture/opportunities/${item.opp.id}`}>
                        <Badge
                          variant="secondary"
                          className={`w-full justify-start text-xs truncate ${
                            item.kind === "response" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}
                          title={`${item.opp.title} — ${item.kind} due`}
                        >
                          {item.kind === "response" ? "R" : "Q"}: {item.opp.title}
                        </Badge>
                      </Link>
                    ))}
                    {items.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{items.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Questions due
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Response due
        </span>
      </div>
    </div>
  );
}

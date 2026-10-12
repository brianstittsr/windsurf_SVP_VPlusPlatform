"use client";

import { Badge } from "@/components/ui/badge";
import { stageLabel } from "@/lib/capture/stages";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  found: "bg-slate-100 text-slate-800",
  qualifying: "bg-blue-100 text-blue-800",
  responding: "bg-blue-100 text-blue-800",
  "bid-no-bid": "bg-purple-100 text-purple-800",
  proposal: "bg-indigo-100 text-indigo-800",
  submitted: "bg-amber-100 text-amber-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

export function StageBadge({ boardType, stage }: { boardType?: string; stage: string }) {
  return (
    <Badge variant="secondary" className={cn(STAGE_COLORS[stage] || "bg-muted text-muted-foreground")}>
      {stageLabel(boardType || "standard", stage)}
    </Badge>
  );
}

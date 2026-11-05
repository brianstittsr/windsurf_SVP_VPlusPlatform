"use client";

import { Badge } from "@/components/ui/badge";
import type { CaptureDeadline } from "@/lib/schema";
import { deadlineStatus, daysUntilDeadline, deadlineBadgeClass, deadlineLabel } from "@/lib/capture/deadline-status";
import { formatDeadlineShort } from "@/lib/capture/dates";
import { cn } from "@/lib/utils";

interface Props {
  deadline?: CaptureDeadline | null;
  yellowDays?: number;
  redDays?: number;
  showDate?: boolean;
  className?: string;
}

/** Rule 6: colored deadline chip (yellow ≤7d, red ≤3d, Overdue). */
export function DeadlineChip({ deadline, yellowDays = 7, redDays = 3, showDate = true, className }: Props) {
  const status = deadlineStatus(deadline, yellowDays, redDays);
  const days = daysUntilDeadline(deadline);
  if (status === "none") return null;

  return (
    <Badge variant="outline" className={cn(deadlineBadgeClass(status), "border", className)}>
      {showDate ? `${formatDeadlineShort(deadline)} · ` : ""}
      {deadlineLabel(status, days)}
    </Badge>
  );
}

import type { CaptureDeadline } from "@/lib/schema";

export type DeadlineStatus = "none" | "ok" | "yellow" | "red" | "overdue";

const DAY_MS = 86_400_000;

/**
 * Rule 6 deadline coloring: red within `redDays` (default 3),
 * yellow within `yellowDays` (default 7), "overdue" once passed.
 */
export function deadlineStatus(
  deadline: CaptureDeadline | null | undefined,
  yellowDays = 7,
  redDays = 3
): DeadlineStatus {
  if (!deadline?.at) return "none";
  const at = new Date(deadline.at).getTime();
  if (Number.isNaN(at)) return "none";
  const daysLeft = (at - Date.now()) / DAY_MS;
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= redDays) return "red";
  if (daysLeft <= yellowDays) return "yellow";
  return "ok";
}

export function daysUntilDeadline(deadline: CaptureDeadline | null | undefined): number | null {
  if (!deadline?.at) return null;
  const at = new Date(deadline.at).getTime();
  if (Number.isNaN(at)) return null;
  return Math.ceil((at - Date.now()) / DAY_MS);
}

export function deadlineBadgeClass(status: DeadlineStatus): string {
  switch (status) {
    case "overdue":
      return "bg-red-600 text-white";
    case "red":
      return "bg-red-100 text-red-800 border-red-300";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "ok":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function deadlineLabel(status: DeadlineStatus, days: number | null): string {
  if (status === "overdue") return "Overdue";
  if (days === null) return "—";
  if (days === 0) return "Due today";
  return `${days}d`;
}

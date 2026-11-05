import type { CaptureDeadline } from "@/lib/schema";

export const AGENCY_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
] as const;

function tzAbbrev(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value || timeZone;
  } catch {
    return timeZone;
  }
}

/**
 * Render a deadline in the agency's timezone and the viewer's local timezone.
 * Returns null for missing/invalid deadlines.
 */
export function formatDualTimezone(deadline?: CaptureDeadline | null): { agency: string; local: string } | null {
  if (!deadline?.at) return null;
  const d = new Date(deadline.at);
  if (Number.isNaN(d.getTime())) return null;
  const tz = deadline.timezone || "UTC";
  const fmt: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
  const agency = `${new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: tz }).format(d)} ${tzAbbrev(d, tz)}`;
  const local = new Intl.DateTimeFormat("en-US", fmt).format(d);
  return { agency, local };
}

/** Short single-line label: "Dec 15, 5:00 PM EST (agency)" / local fallback */
export function formatDeadlineShort(deadline?: CaptureDeadline | null): string {
  const dual = formatDualTimezone(deadline);
  if (!dual) return "—";
  return dual.agency;
}

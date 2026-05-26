/**
 * Date utilities for the kiosk interview.
 * Ensures all dates are stored and displayed consistently as MM/DD/YYYY.
 */

/**
 * Normalizes a raw string to MM/DD/YYYY if it parses as a valid date.
 * Returns null if the string cannot be parsed or is not a reasonable date.
 * Handles 2-digit years by expanding them using a pivot year (current year - 50).
 */
export function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // Strip all non-digit/slash characters
  const cleaned = s.replace(/[^\d/]/g, "");

  // Determine pivot year for 2-digit year expansion
  const currentYear = new Date().getFullYear();
  const pivotYear = currentYear - 50; // 50 years ago as pivot
  const century = currentYear - (currentYear % 100);

  // Try parsing with several common patterns
  const patterns = [
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // MM/DD/YY or M/D/YY (2-digit year)
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
    // MMDDYYYY or MMDYYYY (no separators)
    /^(\d{2})(\d{2})(\d{4})$/,
    // MMDDYY or MMDYY (2-digit year, no separators)
    /^(\d{2})(\d{2})(\d{2})$/,
    // YYYYMMDD (rare, but handle)
    /^(\d{4})(\d{2})(\d{2})$/,
  ];

  for (const pat of patterns) {
    const m = cleaned.match(pat);
    if (!m) continue;
    let month: number, day: number, year: number;

    if (pat === patterns[2]) {
      // YYYYMMDD
      [, year, month, day] = m.map(Number);
    } else if (pat === patterns[3]) {
      // MMDDYY (2-digit year)
      [, month, day, year] = m.map(Number);
      // Expand 2-digit year using pivot
      year = year + (year >= pivotYear % 100 ? century - 100 : century);
    } else if (pat === patterns[4]) {
      // YYYYMMDD
      [, year, month, day] = m.map(Number);
    } else if (pat === patterns[1]) {
      // MM/DD/YY (2-digit year)
      [, month, day, year] = m.map(Number);
      // Expand 2-digit year using pivot
      year = year + (year >= pivotYear % 100 ? century - 100 : century);
    } else {
      // MM/DD/YYYY or MMDDYYYY
      [, month, day, year] = m.map(Number);
    }

    // Validate month/day ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;

    // Validate year is reasonable (1900-2100)
    if (year < 1900 || year > 2100) continue;

    // Construct a Date and verify it survives month rollover (e.g., 02/30 => Mar 2)
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1 || d.getFullYear() !== year || d.getDate() !== day) {
      continue;
    }

    // Format as MM/DD/YYYY with leading zeros
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const yyyy = String(year);
    return `${mm}/${dd}/${yyyy}`;
  }

  // If none of the patterns match, fall back to Date.parse for freeform input
  const fallback = new Date(s);
  if (isNaN(fallback.getTime())) return null;

  const y = fallback.getFullYear();
  const m = fallback.getMonth() + 1;
  const d = fallback.getDate();

  // Reasonable bounds
  if (y < 1900 || y > 2100) return null;

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const yyyy = String(y);
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Formats a Date object as MM/DD/YYYY.
 */
export function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Returns true if a string is a valid MM/DD/YYYY date.
 */
export function isValidDate(val: string | null | undefined): boolean {
  return normalizeDate(val) !== null;
}

/**
 * Formats a raw string for display while typing (adds slashes, caps at 10 chars).
 * Handles both 2-digit and 4-digit years.
 * Does NOT validate; used only for the input field UX.
 */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let formatted = digits;
  if (digits.length >= 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
  if (digits.length >= 4) formatted = formatted.slice(0, 5) + "/" + digits.slice(4);
  return formatted;
}

/** Dates are stored as "YYYY" or "YYYY-MM" (or "" when unknown) and formatted per design settings. */

export type DateFormat = 'short' | 'long' | 'numeric' | 'year';

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const PARTIAL_DATE_RE = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/;

export interface PartialDate {
  year: number;
  month: number | null; // 1-12
}

export function parsePartialDate(value: string): PartialDate | null {
  const m = PARTIAL_DATE_RE.exec(value.trim());
  if (!m) return null;
  return { year: Number(m[1]), month: m[2] ? Number(m[2]) : null };
}

export function formatPartialDate(value: string, format: DateFormat): string {
  const d = parsePartialDate(value);
  if (!d) return value.trim();
  if (format === 'year' || d.month === null) return String(d.year);
  const i = d.month - 1;
  switch (format) {
    case 'long':
      return `${LONG[i]} ${d.year}`;
    case 'numeric':
      return `${String(d.month).padStart(2, '0')}/${d.year}`;
    default:
      return `${SHORT[i]} ${d.year}`;
  }
}

export interface DateRangeLike {
  start: string;
  end: string;
  current: boolean;
}

/** "Nov 2025 – Present", "2022 – 2026", "Jun 2026" or "" */
export function formatDateRange(r: DateRangeLike, format: DateFormat, presentLabel = 'Present'): string {
  const start = r.start ? formatPartialDate(r.start, format) : '';
  const end = r.current ? presentLabel : r.end ? formatPartialDate(r.end, format) : '';
  if (start && end) return start === end ? start : `${start} – ${end}`;
  return start || end;
}

/** Comparable month index; missing month counts as January for starts, December for ends. */
export function toMonthIndex(value: string, as: 'start' | 'end'): number | null {
  const d = parsePartialDate(value);
  if (!d) return null;
  return d.year * 12 + ((d.month ?? (as === 'start' ? 1 : 12)) - 1);
}

/** True when the end is before the start. */
export function isRangeInverted(r: DateRangeLike): boolean {
  if (r.current || !r.start || !r.end) return false;
  const s = toMonthIndex(r.start, 'start');
  const e = toMonthIndex(r.end, 'end');
  return s !== null && e !== null && e < s;
}

const MONTH_LOOKUP = new Map<string, number>([
  ...SHORT.map((m, i) => [m.toLowerCase(), i + 1] as const),
  ...LONG.map((m, i) => [m.toLowerCase(), i + 1] as const),
  ['sept', 9] as const,
]);

/** Best-effort parse of free text like "Nov 2025", "11/2025", "2022" (used by legacy import). */
export function parseLooseDate(text: string): string {
  const t = text.trim().toLowerCase();
  let m = /^([a-z]+)\.?\s+(\d{4})$/.exec(t);
  if (m) {
    const month = MONTH_LOOKUP.get(m[1]!);
    if (month) return `${m[2]}-${String(month).padStart(2, '0')}`;
  }
  m = /^(\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return `${m[2]}-${m[1]!.padStart(2, '0')}`;
  m = /^(\d{4})-(\d{2})$/.exec(t);
  if (m) return t;
  m = /^(\d{4})$/.exec(t);
  if (m) return m[1]!;
  return '';
}

const PRESENT_RE = /^(present|current|now|ongoing|today)$/i;

/** "Nov 2025 – Present" → { start: "2025-11", end: "", current: true } */
export function parseLooseRange(text: string | undefined | null): DateRangeLike {
  const parts = (text ?? '').split(/\s*[–—]\s*|\s+-\s+|\s+to\s+/i).filter(Boolean);
  const start = parts[0] ? parseLooseDate(parts[0]) : '';
  const endRaw = parts[1]?.trim() ?? '';
  const current = PRESENT_RE.test(endRaw);
  const end = current ? '' : endRaw ? parseLooseDate(endRaw) : '';
  return { start, end, current };
}

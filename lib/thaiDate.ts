/**
 * Thai date display and parsing.
 *
 * Native `<input type="date">` renders in the browser's own locale (MM/DD/YYYY
 * on a US machine), and that cannot be changed from CSS or an attribute. Every
 * date field in the backoffice therefore shows its value through these helpers
 * and stores the ISO string the API expects.
 *
 * Display is the Thai convention: DD/MM/YYYY in the Buddhist era (2569, not
 * 2026), with 24-hour time. Parsing accepts both eras so a value typed as
 * 23/11/2026 is understood as 2026.
 */

const BE_OFFSET = 543;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/** "2026-11-23" → "23/11/2569". Returns "" for an empty or invalid value. */
export function formatThaiDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${Number(m[1]) + BE_OFFSET}`;
}

/** "2026-11-23T14:30" → "23/11/2569 14:30". */
export function formatThaiDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = formatThaiDate(iso);
  if (!date) return "";
  const t = /T(\d{2}):(\d{2})/.exec(iso);
  return t ? `${date} ${t[1]}:${t[2]}` : date;
}

/** "2026-11" → "11/2569". */
export function formatThaiMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[2]}/${Number(m[1]) + BE_OFFSET}`;
}

/** Reads a year that may be CE (2026) or BE (2569) and returns the CE year. */
function toCE(year: number): number {
  return year >= 2400 ? year - BE_OFFSET : year;
}

function validDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/**
 * Parses a typed Thai date ("23/11/2569", "23/11/2026", "23-11-2569") into
 * "2026-11-23". Returns null when the text is not a real date, so the caller can
 * keep the previous value instead of storing nonsense.
 */
export function parseThaiDate(text: string): string | null {
  const m = /^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s*$/.exec(text);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = toCE(Number(m[3]));
  if (!validDate(y, mo, d)) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** Parses "23/11/2569 14:30" (time optional) into "2026-11-23T14:30". */
export function parseThaiDateTime(text: string): string | null {
  const m = /^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:[ T](\d{1,2}):(\d{2}))?\s*$/.exec(text);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = toCE(Number(m[3]));
  if (!validDate(y, mo, d)) return null;
  const date = `${y}-${pad(mo)}-${pad(d)}`;
  if (m[4] === undefined) return date;
  const h = Number(m[4]);
  const mi = Number(m[5]);
  if (h > 23 || mi > 59) return null;
  return `${date}T${pad(h)}:${pad(mi)}`;
}

/** Parses "11/2569" or "11/2026" into "2026-11". */
export function parseThaiMonth(text: string): string | null {
  const m = /^\s*(\d{1,2})[/\-.](\d{4})\s*$/.exec(text);
  if (!m) return null;
  const mo = Number(m[1]);
  const y = toCE(Number(m[2]));
  if (mo < 1 || mo > 12) return null;
  return `${y}-${pad(mo)}`;
}

/** Today in Bangkok as "YYYY-MM-DD" (the value the API expects). */
export function bangkokTodayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts;
}
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/**
 * Text display of a calendar date: "2026-11-23" → "23 พ.ย. 2569". Read from
 * the ISO digits (no Date / timezone), so a date never shifts by a day.
 * Anything that is not an ISO date is returned unchanged.
 */
export function formatThaiDateText(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${THAI_MONTHS_SHORT[Number(m[2]) - 1]} ${Number(m[1]) + BE_OFFSET}`;
}

/** "2026-11" → "พ.ย. 2569"; with short=true → "พ.ย. 69". */
export function formatThaiMonthText(iso: string | null | undefined, short = false): string {
  if (!iso) return "-";
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const year = Number(m[1]) + BE_OFFSET;
  return `${THAI_MONTHS_SHORT[Number(m[2]) - 1]} ${short ? String(year % 100).padStart(2, "0") : year}`;
}

/** "2026-08-26", "2026-11-23" → "26 ส.ค. 2569 – 23 พ.ย. 2569". */
export function formatThaiDateRange(from: string, to: string): string {
  if (!from || !to) return "-";
  if (from === to) return formatThaiDateText(from);
  return `${formatThaiDateText(from)} – ${formatThaiDateText(to)}`;
}

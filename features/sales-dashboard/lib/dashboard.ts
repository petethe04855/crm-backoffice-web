import type { SalesFilters } from "../types/salesDashboard";
import { formatThaiDateRange, formatThaiDateText, formatThaiMonthText } from "@/lib/thaiDate";

/**
 * Platform pills of the filter bar; "all" means no channel filter.
 * TikTok Live/product/video are accepted by the API but the ERP has no content
 * channel column yet, so they would return the same rows as "tiktok".
 */
export const CHANNEL_OPTIONS = [
  { value: "all", label: "ทุกช่องทาง", icon: "🌐" },
  { value: "shopee", label: "Shopee", icon: "🛍️" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
] as const;

/**
 * Thai region names exactly as crm-core reports them; the API rejects any other
 * value, so these must stay byte-identical to the backend constants.
 */
export const REGION_OPTIONS = [
  "กรุงเทพฯ และปริมณฑล",
  "ภาคกลาง",
  "ภาคตะวันออก",
  "ภาคเหนือ",
  "ภาคอีสาน",
  "ภาคใต้",
  "ภาคตะวันตก",
] as const;

export interface DateRange {
  from: string;
  to: string;
}

/**
 * Today in Asia/Bangkok as YYYY-MM-DD. Thailand has no DST, so a fixed +07:00
 * offset is exact and avoids depending on the browser's time zone.
 */
export function bangkokToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Adds whole days to a YYYY-MM-DD day (UTC arithmetic, no DST surprises). */
export function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Day of a YYYY-MM-DD month boundary helpers. */
function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

function monthEnd(day: string): string {
  const d = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

export type PresetKey = "7d" | "30d" | "90d" | "thisMonth" | "lastMonth";

export const PRESETS: { key: PresetKey; label: string; range: (today: string) => DateRange }[] = [
  { key: "7d", label: "7 วัน", range: (today) => ({ from: addDays(today, -6), to: today }) },
  { key: "30d", label: "30 วัน", range: (today) => ({ from: addDays(today, -29), to: today }) },
  { key: "90d", label: "90 วัน", range: (today) => ({ from: addDays(today, -89), to: today }) },
  { key: "thisMonth", label: "เดือนนี้", range: (today) => ({ from: monthStart(today), to: today }) },
  {
    key: "lastMonth",
    label: "เดือนก่อน",
    range: (today) => {
      const from = monthStart(addDays(monthStart(today), -1));
      return { from, to: monthEnd(from) };
    },
  },
];

/** The preset matching a range, or null when the user picked custom dates. */
export function matchPreset(range: DateRange, today: string = bangkokToday()): PresetKey | null {
  for (const preset of PRESETS) {
    const r = preset.range(today);
    if (r.from === range.from && r.to === range.to) return preset.key;
  }
  return null;
}

export function defaultFilters(today: string = bangkokToday()): SalesFilters {
  const range = PRESETS[2].range(today);
  return { dateFrom: range.from, dateTo: range.to, channel: "all", region: "" };
}

export function daysInclusive(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

/** A range is valid for the API when both dates exist, ordered, within 366 days. */
export function isRangeValid(from: string, to: string): boolean {
  const days = daysInclusive(from, to);
  return days > 0 && days <= 366;
}

const baht = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

export function formatBaht(value: number): string {
  return baht.format(value);
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? whole.format(value) : decimal.format(value);
}

export function formatPercent(value: number): string {
  return `${decimal.format(value)}%`;
}

/** Compact money for axis labels: 1.2k / 3.4M. */
export function formatCompactBaht(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `฿${decimal.format(value / 1_000_000)}M`;
  if (abs >= 1_000) return `฿${decimal.format(value / 1_000)}k`;
  return `฿${whole.format(value)}`;
}

export function formatRange(from: string, to: string): string {
  return formatThaiDateRange(from, to);
}

/** Tailwind-free trend class used by the CSS (.product-change up/down). */
export function changeClass(value: number | null): string {
  if (value === null || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
}

/** "▲ 12.5% เทียบช่วงก่อน" or "— เทียบช่วงก่อน" when there is no baseline. */
export function changeLabel(value: number | null): string {
  if (value === null) return "— เทียบช่วงก่อน";
  const arrow = value > 0 ? "▲" : value < 0 ? "▼" : "•";
  return `${arrow} ${formatPercent(Math.abs(value))} เทียบช่วงก่อน`;
}

/** Week label "2026-W46" -> "W46"; month "2026-11" -> "พ.ย. 26". */
export function shortPeriod(period: string): string {
  if (period.includes("-W")) return period.split("-W")[1] ? `W${period.split("-W")[1]}` : period;
  if (/^\d{4}-\d{2}$/.test(period)) return formatThaiMonthText(period, true);
  return formatThaiDateText(period);
}

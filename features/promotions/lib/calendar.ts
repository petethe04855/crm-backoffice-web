import type { Promotion } from "../types/promotion";

/** "YYYY-MM" of the given date in browser local time. */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Moves a "YYYY-MM" key by delta months (negative goes back). */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = parseMonth(month);
  const d = new Date(year, monthNumber - 1 + delta, 1);
  return monthKey(d);
}

/** Parses "YYYY-MM"; falls back to the current month when malformed. */
export function parseMonth(month: string): [number, number] {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1];
  }
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1];
  }
  return [year, monthNumber];
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = parseMonth(month);
  return new Date(year, monthNumber, 0).getDate();
}

/** Thai short month name for the calendar heading. */
export function monthLabel(month: string): string {
  const [year, monthNumber] = parseMonth(month);
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1),
  );
}

export interface PromotionBar {
  /** 1-based day of the month where the bar starts. */
  startDay: number;
  /** How many day cells the bar covers (>= 1). */
  spanDays: number;
}

/**
 * The part of a promotion's display window that falls inside the month, as day
 * cells. Half-open like the backend: a promotion ending at 00:00 does not draw
 * on that day. Returns null when the promotion has no window or misses the
 * month entirely.
 */
export function promotionBar(
  month: string,
  promotion: Pick<Promotion, "displayStartAt" | "displayEndAt">,
): PromotionBar | null {
  if (!promotion.displayStartAt || !promotion.displayEndAt) return null;

  const [year, monthNumber] = parseMonth(month);
  const monthStart = new Date(year, monthNumber - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, monthNumber, 1, 0, 0, 0, 0);

  const start = new Date(promotion.displayStartAt);
  const end = new Date(promotion.displayEndAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start >= monthEnd || end <= monthStart) return null;

  const clippedStart = start < monthStart ? monthStart : start;
  const clippedEnd = end > monthEnd ? monthEnd : end;

  const startDay = clippedStart.getDate();
  const lastDay = new Date(clippedEnd.getTime() - 1).getDate();
  if (lastDay < startDay) return null;
  return { startDay, spanDays: lastDay - startDay + 1 };
}

/** Promotions that draw at least one cell in the month, sorted by start day. */
export function layoutMonth(
  month: string,
  promotions: Promotion[],
): Array<{ promotion: Promotion; bar: PromotionBar }> {
  return promotions
    .map((promotion) => ({ promotion, bar: promotionBar(month, promotion) }))
    .filter((row): row is { promotion: Promotion; bar: PromotionBar } => row.bar !== null)
    .sort((a, b) => {
      if (a.bar.startDay !== b.bar.startDay) return a.bar.startDay - b.bar.startDay;
      return b.promotion.priority - a.promotion.priority;
    });
}

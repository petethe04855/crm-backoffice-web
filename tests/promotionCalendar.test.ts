import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  layoutMonth,
  monthLabel,
  promotionBar,
  shiftMonth,
} from "@/features/promotions/lib/calendar";
import type { Promotion } from "@/features/promotions/types/promotion";

function at(year: number, monthIndex: number, day: number, hour = 0, minute = 0): string {
  return new Date(year, monthIndex, day, hour, minute).toISOString();
}

function promo(id: string, start: string | null, end: string | null, priority = 0): Promotion {
  return {
    id,
    title: id,
    description: "",
    imageUrl: "",
    placement: "home_banner",
    displayStartAt: start,
    displayEndAt: end,
    ctaType: "none",
    ctaTarget: "",
    audience: { tiers: [], newMemberDays: null },
    priority,
    status: "published",
    displayStatus: "live",
    lineVisibility: { visible: true, reason: "live" },
    warnings: [],
    createdBy: 1,
    createdByEmail: "o@example.com",
    updatedBy: 1,
    updatedByEmail: "o@example.com",
    createdAt: start ?? at(2026, 0, 1),
    updatedAt: start ?? at(2026, 0, 1),
  };
}

describe("shiftMonth / daysInMonth", () => {
  it("crosses year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-11", -1)).toBe("2026-10");
    expect(shiftMonth("2026-07", 18)).toBe("2028-01");
  });

  it("knows the days in a month", () => {
    expect(daysInMonth("2026-11")).toBe(30);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2024-02")).toBe(29);
    expect(daysInMonth("2026-12")).toBe(31);
  });

  it("labels a month for humans", () => {
    expect(monthLabel("2026-11").length).toBeGreaterThan(0);
  });
});

describe("promotionBar", () => {
  it("draws a window inside the month", () => {
    expect(promotionBar("2026-11", promo("p", at(2026, 10, 18, 10), at(2026, 10, 20, 20)))).toEqual({
      startDay: 18,
      spanDays: 3,
    });
  });

  it("treats the window as half-open at midnight", () => {
    // Ends at 00:00 on the 20th, so the 20th has no bar.
    expect(promotionBar("2026-11", promo("p", at(2026, 10, 18, 10), at(2026, 10, 20, 0)))).toEqual({
      startDay: 18,
      spanDays: 2,
    });
    // A window starting at 00:00 on the 1st of next month does not touch November.
    expect(promotionBar("2026-11", promo("p", at(2026, 9, 1), at(2026, 10, 1, 0)))).toBeNull();
  });

  it("clips a window that spans the whole month", () => {
    expect(promotionBar("2026-11", promo("p", at(2026, 9, 15), at(2026, 11, 15)))).toEqual({
      startDay: 1,
      spanDays: 30,
    });
  });

  it("returns null for drafts, missing windows and other months", () => {
    expect(promotionBar("2026-11", promo("p", null, null))).toBeNull();
    expect(promotionBar("2026-11", promo("p", at(2026, 11, 1), at(2026, 11, 10)))).toBeNull();
    expect(promotionBar("2026-12", promo("p", at(2026, 10, 18), at(2026, 10, 20)))).toBeNull();
  });

  it("handles a single-day window", () => {
    expect(promotionBar("2026-11", promo("p", at(2026, 10, 18, 9), at(2026, 10, 18, 17)))).toEqual({
      startDay: 18,
      spanDays: 1,
    });
  });
});

describe("layoutMonth", () => {
  it("keeps only the rows that draw in the month, earliest first", () => {
    const rows = layoutMonth("2026-11", [
      promo("late", at(2026, 10, 25), at(2026, 10, 28), 9),
      promo("early", at(2026, 10, 2), at(2026, 10, 4, 23, 0)),
      promo("draft", null, null),
    ]);
    expect(rows.map((r) => r.promotion.id)).toEqual(["early", "late"]);
    expect(rows[0].bar).toEqual({ startDay: 2, spanDays: 3 });

    const sameDay = layoutMonth("2026-11", [
      promo("low", at(2026, 10, 5), at(2026, 10, 6), 1),
      promo("high", at(2026, 10, 5), at(2026, 10, 6), 10),
    ]);
    expect(sameDay.map((r) => r.promotion.id)).toEqual(["high", "low"]);
  });
});

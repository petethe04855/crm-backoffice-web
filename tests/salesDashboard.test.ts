import { describe, expect, it } from "vitest";
import { buildSalesParams } from "@/features/sales-dashboard/api/salesDashboardApi";
import {
  PRESETS,
  addDays,
  bangkokToday,
  changeClass,
  changeLabel,
  defaultFilters,
  formatCompactBaht,
  formatNumber,
  isRangeValid,
  matchPreset,
  shortPeriod,
} from "@/features/sales-dashboard/lib/dashboard";
import type { SalesFilters } from "@/features/sales-dashboard/types/salesDashboard";

const base: SalesFilters = {
  dateFrom: "2026-11-01",
  dateTo: "2026-11-30",
  channel: "all",
  region: "",
};

describe("buildSalesParams", () => {
  it("drops the default channel and empty region", () => {
    expect(buildSalesParams(base)).toEqual({ dateFrom: "2026-11-01", dateTo: "2026-11-30" });
  });

  it("keeps explicit filters", () => {
    expect(
      buildSalesParams({ ...base, channel: "tiktok_live", region: "ภาคใต้" }),
    ).toEqual({
      dateFrom: "2026-11-01",
      dateTo: "2026-11-30",
      channel: "tiktok_live",
      region: "ภาคใต้",
    });
  });
});

describe("Bangkok dates", () => {
  it("rolls over to the Bangkok day, not UTC", () => {
    expect(bangkokToday(new Date("2026-11-16T18:00:00Z"))).toBe("2026-11-17");
    expect(bangkokToday(new Date("2026-11-16T16:59:00Z"))).toBe("2026-11-16");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("builds every preset on the given day", () => {
    const today = "2026-11-17";
    const ranges = Object.fromEntries(PRESETS.map((p) => [p.key, p.range(today)]));
    expect(ranges["7d"]).toEqual({ from: "2026-11-11", to: "2026-11-17" });
    expect(ranges["30d"]).toEqual({ from: "2026-10-19", to: "2026-11-17" });
    expect(ranges.thisMonth).toEqual({ from: "2026-11-01", to: "2026-11-17" });
    expect(ranges.lastMonth).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  });

  it("matches the applied range back to a preset", () => {
    expect(matchPreset({ from: "2026-11-11", to: "2026-11-17" }, "2026-11-17")).toBe("7d");
    expect(matchPreset({ from: "2026-11-01", to: "2026-11-16" }, "2026-11-17")).toBeNull();
  });

  it("defaults to the last 90 days, all channels and every region", () => {
    expect(defaultFilters("2026-11-17")).toEqual({
      dateFrom: "2026-08-20",
      dateTo: "2026-11-17",
      channel: "all",
      region: "",
    });
  });
});

describe("range validation", () => {
  it("accepts one day and 366 days", () => {
    expect(isRangeValid("2026-11-17", "2026-11-17")).toBe(true);
    expect(isRangeValid("2025-11-18", "2026-11-17")).toBe(true);
  });

  it("rejects reversed, empty and oversized ranges", () => {
    expect(isRangeValid("2026-11-17", "2026-11-01")).toBe(false);
    expect(isRangeValid("", "2026-11-01")).toBe(false);
    expect(isRangeValid("2025-11-16", "2026-11-17")).toBe(false);
  });
});

describe("formatting", () => {
  it("formats whole and decimal numbers", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(12.5)).toBe("12.5");
  });

  it("compacts money for chart labels", () => {
    expect(formatCompactBaht(950)).toBe("฿950");
    expect(formatCompactBaht(1_500)).toBe("฿1.5k");
    expect(formatCompactBaht(2_000_000)).toBe("฿2M");
  });

  it("labels deltas and their direction", () => {
    expect(changeClass(12)).toBe("up");
    expect(changeClass(-12)).toBe("down");
    expect(changeClass(null)).toBe("neutral");
    expect(changeLabel(null)).toContain("เทียบช่วงก่อน");
    expect(changeLabel(12.5)).toContain("▲");
    expect(changeLabel(-3)).toContain("▼");
  });

  it("shortens trend periods", () => {
    expect(shortPeriod("2026-W46")).toBe("W46");
    expect(shortPeriod("2026-11")).toMatch(/26$/);
  });
});

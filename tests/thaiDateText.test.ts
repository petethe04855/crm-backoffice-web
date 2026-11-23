import { describe, expect, it } from "vitest";
import { formatThaiDateRange, formatThaiDateText, formatThaiMonthText } from "@/lib/thaiDate";
import { formatRange, shortPeriod } from "@/features/sales-dashboard/lib/dashboard";

describe("Thai date text", () => {
  it("formats calendar dates in the Buddhist era without a timezone shift", () => {
    expect(formatThaiDateText("2026-11-23")).toBe("23 พ.ย. 2569");
    expect(formatThaiDateText("2026-01-01")).toBe("1 ม.ค. 2569");
    expect(formatThaiDateText("2026-12-31T23:30:00Z")).toBe("31 ธ.ค. 2569");
    expect(formatThaiDateText("")).toBe("-");
  });
  it("formats months and ranges", () => {
    expect(formatThaiMonthText("2026-11")).toBe("พ.ย. 2569");
    expect(formatThaiMonthText("2026-11", true)).toBe("พ.ย. 69");
    expect(formatThaiDateRange("2026-08-26", "2026-11-23")).toBe("26 ส.ค. 2569 – 23 พ.ย. 2569");
    expect(formatThaiDateRange("2026-11-23", "2026-11-23")).toBe("23 พ.ย. 2569");
  });
  it("is used by the dashboard labels", () => {
    expect(formatRange("2026-08-26", "2026-11-23")).toBe("26 ส.ค. 2569 – 23 พ.ย. 2569");
    expect(shortPeriod("2026-11")).toBe("พ.ย. 69");
    expect(shortPeriod("2026-11-16")).toBe("16 พ.ย. 2569");
    expect(shortPeriod("2026-W47")).toBe("W47");
  });
});

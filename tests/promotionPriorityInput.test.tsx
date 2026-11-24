import { describe, expect, it } from "vitest";
import { findPriorityHolder, parsePriority } from "@/features/promotions/components/PromotionPriorityInput";
import type { Promotion } from "@/features/promotions/types/promotion";

describe("parsePriority", () => {
  it("accepts positions 1–9999; empty or 0 means not set", () => {
    expect(parsePriority("")).toBe(0);
    expect(parsePriority(" ")).toBe(0);
    expect(parsePriority("0")).toBe(0);
    expect(parsePriority("1")).toBe(1);
    expect(parsePriority(" 12 ")).toBe(12);
    expect(parsePriority("9999")).toBe(9999);
  });

  it("rejects negative, decimal and out-of-range text", () => {
    for (const text of ["-1", "1.5", "abc", "10000"]) {
      expect(parsePriority(text)).toBeNull();
    }
  });
});

describe("findPriorityHolder", () => {
  const row = (id: string, priority: number, status = "published") =>
    ({ id, title: `โปร ${id}`, priority, status }) as unknown as Promotion;

  it("finds another active row holding the position", () => {
    const rows = [row("a", 1), row("b", 2), row("c", 3, "archived")];
    expect(findPriorityHolder(2, rows[0], rows)?.id).toBe("b");
    expect(findPriorityHolder(1, rows[0], rows)).toBeUndefined();
    expect(findPriorityHolder(3, rows[0], rows)).toBeUndefined();
    expect(findPriorityHolder(0, rows[0], [row("x", 0)])).toBeUndefined();
  });
});

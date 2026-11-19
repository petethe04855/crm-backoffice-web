import { describe, expect, it } from "vitest";
import {
  EMPTY_EARN_RULE_FORM,
  earnRuleFormSchema,
  fieldErrors,
  toEarnRuleFormValues,
  toEarnRuleInput,
  wholeNumberError,
} from "@/features/point-rules/schemas/pointRuleForms";

const errorsOf = (v: typeof EMPTY_EARN_RULE_FORM) => {
  const r = earnRuleFormSchema.safeParse(v);
  return r.success ? {} : fieldErrors(r.error);
};

describe("earnRuleFormSchema", () => {
  it("accepts the default campaign", () => {
    expect(errorsOf(EMPTY_EARN_RULE_FORM)).toEqual({});
  });

  it("needs a tier for a tier multiplier", () => {
    expect(errorsOf({ ...EMPTY_EARN_RULE_FORM, type: "tier_multiplier" })).toHaveProperty("tierId");
  });

  it("rejects zero, negative and huge multipliers", () => {
    for (const m of ["0", "-1", "1000", "abc", ""]) {
      expect(errorsOf({ ...EMPTY_EARN_RULE_FORM, multiplier: m })).toHaveProperty("multiplier");
    }
  });

  it("needs a trigger and positive points for a fixed bonus", () => {
    const e = errorsOf({ ...EMPTY_EARN_RULE_FORM, type: "bonus_fixed", points: "0" });
    expect(e).toHaveProperty("trigger");
    expect(e).toHaveProperty("points");
  });

  it("rejects an end before the start", () => {
    expect(
      errorsOf({ ...EMPTY_EARN_RULE_FORM, startAt: "2026-11-20T10:00", endAt: "2026-11-20T09:00" }),
    ).toHaveProperty("endAt");
  });
});

describe("toEarnRuleInput", () => {
  it("parses SKU lists and clears fields the type does not use", () => {
    const input = toEarnRuleInput({ ...EMPTY_EARN_RULE_FORM, skuIds: " a, b  c ", stackable: true, tierId: "3" });
    expect(input.skuIds).toEqual(["a", "b", "c"]);
    expect(input.stackable).toBe(true);
    expect(input.tierId).toBeNull();
    expect(input.points).toBe(0);
    expect(input.startAt).toBeNull();
  });

  it("sends a bonus with multiplier 1 and no SKUs", () => {
    const input = toEarnRuleInput({
      ...EMPTY_EARN_RULE_FORM,
      type: "bonus_fixed",
      trigger: "signup",
      points: "100",
      skuIds: "x",
    });
    expect(input).toMatchObject({ multiplier: 1, skuIds: [], trigger: "signup", points: 100, stackable: false });
  });

  it("round-trips an existing rule", () => {
    const values = toEarnRuleFormValues({
      id: 1,
      type: "tier_multiplier",
      tierId: 2,
      multiplier: 1.5,
      skuIds: [],
      trigger: "",
      points: 0,
      startAt: null,
      endAt: null,
      stackable: false,
      priority: 3,
      isActive: false,
      updatedByEmail: "",
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    });
    expect(toEarnRuleInput(values)).toMatchObject({ type: "tier_multiplier", tierId: 2, multiplier: 1.5, priority: 3, isActive: false });
  });
});

describe("wholeNumberError", () => {
  it("accepts whole numbers within the bound", () => {
    expect(wholeNumberError("0", "x", 10)).toBeNull();
    expect(wholeNumberError("10", "x", 10)).toBeNull();
  });

  it("rejects negatives, decimals and values over the bound", () => {
    expect(wholeNumberError("-1", "แต้ม", 10)).toContain("จำนวนเต็ม");
    expect(wholeNumberError("1.5", "แต้ม", 10)).toContain("จำนวนเต็ม");
    expect(wholeNumberError("11", "แต้ม", 10)).toContain("ไม่เกิน");
  });
});

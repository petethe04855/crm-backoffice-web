import { describe, expect, it } from "vitest";
import { validateAdjustDraft } from "@/features/membership/components/PointsAdjustDialog";
import { LEDGER_TYPE_LABEL } from "@/features/membership/types/member";

describe("validateAdjustDraft", () => {
  it("accepts a grant with a reason", () => {
    expect(validateAdjustDraft("250", "ชดเชยลูกค้า", 0)).toBeNull();
  });

  it("accepts a deduction within the balance", () => {
    expect(validateAdjustDraft("-100", "แก้ไขแต้ม", 250)).toBeNull();
  });

  it("rejects a deduction larger than the balance", () => {
    expect(validateAdjustDraft("-251", "หักเกินยอด", 250)).toContain("เกินยอด");
  });

  it("rejects empty, non-numeric and zero amounts", () => {
    expect(validateAdjustDraft("", "ชดเชย", 0)).not.toBeNull();
    expect(validateAdjustDraft("abc", "ชดเชย", 0)).not.toBeNull();
    expect(validateAdjustDraft("0", "ชดเชย", 0)).not.toBeNull();
  });

  it("rejects fractional points", () => {
    expect(validateAdjustDraft("1.5", "ชดเชย", 0)).toContain("จำนวนเต็ม");
  });

  it("requires a meaningful reason", () => {
    expect(validateAdjustDraft("10", "ok", 0)).toContain("เหตุผล");
  });
});

describe("LEDGER_TYPE_LABEL", () => {
  it("labels every ledger type the API can return", () => {
    expect(Object.keys(LEDGER_TYPE_LABEL).sort()).toEqual(
      ["adjust", "earn", "expire", "redeem", "refund", "reverse"],
    );
  });
});

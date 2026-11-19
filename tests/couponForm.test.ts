import { describe, expect, it } from "vitest";
import { buildCouponParams } from "@/features/coupons/api/couponsApi";
import { describeBenefit, describeExpiry, describeQuota } from "@/features/coupons/lib/benefit";
import {
  EMPTY_COUPON_FORM,
  couponFormSchema,
  fieldErrors,
  toCouponFormValues,
  toCouponInput,
  type CouponFormValues,
} from "@/features/coupons/schemas/couponForm";
import { EMPTY_COUPON_FILTERS, type Coupon } from "@/features/coupons/types/coupon";

const valid: CouponFormValues = { ...EMPTY_COUPON_FORM, name: "ลด 50 บาท", benefitValue: "50", pointsCost: "30" };
const errorsOf = (v: CouponFormValues) => {
  const r = couponFormSchema.safeParse(v);
  return r.success ? {} : fieldErrors(r.error);
};

describe("couponFormSchema", () => {
  it("accepts a valid amount coupon", () => {
    expect(errorsOf(valid)).toEqual({});
  });

  it("needs a name and a positive amount", () => {
    const e = errorsOf({ ...valid, name: " ", benefitValue: "0" });
    expect(e).toHaveProperty("name");
    expect(e).toHaveProperty("benefitValue");
  });

  it("needs a cap for percent discounts and a 0–100 percent", () => {
    expect(errorsOf({ ...valid, benefitType: "percent_off", benefitValue: "10" })).toHaveProperty("maxDiscount");
    expect(errorsOf({ ...valid, benefitType: "percent_off", benefitValue: "120", maxDiscount: "50" })).toHaveProperty(
      "benefitValue",
    );
  });

  it("checks both expiry modes", () => {
    expect(errorsOf({ ...valid, expiryMode: "fixed_date" })).toHaveProperty("expiresAt");
    expect(
      errorsOf({ ...valid, expiryMode: "fixed_date", claimEnd: "2026-12-31T00:00", expiresAt: "2026-12-01T00:00" }),
    ).toHaveProperty("expiresAt");
    expect(errorsOf({ ...valid, validDays: "0" })).toHaveProperty("validDays");
    expect(errorsOf({ ...valid, validDays: "366" })).toHaveProperty("validDays");
  });

  it("forces a shared code for marketplaces", () => {
    expect(errorsOf({ ...valid, channel: "shopee" })).toHaveProperty("codeType");
    expect(errorsOf({ ...valid, channel: "shopee", codeType: "shared", sharedCode: "x" })).toHaveProperty("sharedCode");
    expect(errorsOf({ ...valid, channel: "shopee", codeType: "shared", sharedCode: "CHAWY-11" })).toEqual({});
  });

  it("rejects fractional points and a zero per-member limit", () => {
    const e = errorsOf({ ...valid, pointsCost: "1.5", limitPerMember: "0" });
    expect(e).toHaveProperty("pointsCost");
    expect(e).toHaveProperty("limitPerMember");
  });
});

describe("toCouponInput", () => {
  it("clears fields the choices do not use", () => {
    const input = toCouponInput({ ...valid, maxDiscount: "99", sharedCode: "ABC", validDays: "7" });
    expect(input).toMatchObject({ benefitValue: 50, maxDiscount: null, sharedCode: "", validDays: 7, expiresAt: null });

    const free = toCouponInput({ ...valid, benefitType: "free_shipping" });
    expect(free.benefitValue).toBe(0);

    const fixed = toCouponInput({ ...valid, expiryMode: "fixed_date", expiresAt: "2026-12-31T23:59" });
    expect(fixed.validDays).toBe(0);
    expect(fixed.expiresAt).toMatch(/^2026-12-31T|^2027-01-01T|^2026-12-31/);

    const shared = toCouponInput({ ...valid, channel: "tiktok", codeType: "shared", sharedCode: " chawy-11 " });
    expect(shared.sharedCode).toBe("CHAWY-11");
  });

  it("round-trips an existing coupon", () => {
    const coupon: Coupon = {
      id: 1, name: "ลด 10%", description: "", imageUrl: "", terms: "", benefitType: "percent_off", benefitValue: 10,
      maxDiscount: 100, minSpend: 300, pointsCost: 50, claimStartAt: null, claimEndAt: null, expiryMode: "days_after_claim",
      expiresAt: null, validDays: 14, totalQuota: 100, claimedCount: 3, usedCount: 1, remainingQuota: 97, limitPerMember: 2,
      minTierId: 2, channel: "store", codeType: "unique", sharedCode: "", status: "active", updatedByEmail: "",
      createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z",
    };
    expect(toCouponInput(toCouponFormValues(coupon))).toMatchObject({
      benefitType: "percent_off", benefitValue: 10, maxDiscount: 100, minSpend: 300, pointsCost: 50,
      validDays: 14, totalQuota: 100, limitPerMember: 2, minTierId: 2,
    });
  });
});

describe("buildCouponParams", () => {
  it("drops empty filters and trims search", () => {
    expect(buildCouponParams(EMPTY_COUPON_FILTERS)).toEqual({ page: 1, limit: 20 });
    expect(buildCouponParams({ ...EMPTY_COUPON_FILTERS, search: " ลด ", month: "2026-11", status: "active", channel: "line" })).toEqual({
      page: 1, limit: 20, search: "ลด", month: "2026-11", status: "active", channel: "line",
    });
  });
});

describe("benefit text", () => {
  it("describes each benefit", () => {
    expect(describeBenefit({ benefitType: "amount_off", benefitValue: 50, maxDiscount: null })).toBe("ลด 50 บาท");
    expect(describeBenefit({ benefitType: "percent_off", benefitValue: 10, maxDiscount: 100, minSpend: 300 })).toBe(
      "ลด 10% สูงสุด 100 บาท เมื่อซื้อครบ 300 บาท",
    );
    expect(describeBenefit({ benefitType: "free_shipping", benefitValue: 0, maxDiscount: null })).toBe("ส่งฟรี");
  });

  it("describes expiry and quota", () => {
    expect(describeExpiry({ expiryMode: "days_after_claim", validDays: 30, expiresAt: null })).toBe("ใช้ได้ 30 วันหลังแลก");
    expect(describeQuota({ claimedCount: 3, totalQuota: 0 })).toBe("3 / ไม่จำกัด");
    expect(describeQuota({ claimedCount: 1200, totalQuota: 5000 })).toBe("1,200 / 5,000");
  });
});

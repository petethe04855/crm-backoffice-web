import { describe, expect, it } from "vitest";
import { buildRedemptionParams, buildRewardParams } from "@/features/rewards/api/rewardsApi";
import {
  EMPTY_REWARD_FORM,
  describeStock,
  fieldErrors,
  rewardFormSchema,
  toRewardFormValues,
  toRewardInput,
  type RewardFormValues,
} from "@/features/rewards/schemas/rewardForm";
import {
  CANCELLABLE,
  EMPTY_REDEMPTION_FILTERS,
  EMPTY_REWARD_FILTERS,
  NEXT_ACTION,
  type Reward,
} from "@/features/rewards/types/reward";

const valid: RewardFormValues = {
  ...EMPTY_REWARD_FORM,
  name: "ขนมไก่",
  imageUrl: "/api/v1/files/x",
  erpSkuId: "101",
  skuCode: "CHK-01",
  pointsCost: "40",
};
const errorsOf = (v: RewardFormValues) => {
  const r = rewardFormSchema.safeParse(v);
  return r.success ? {} : fieldErrors(r.error);
};

describe("rewardFormSchema", () => {
  it("accepts a valid reward", () => {
    expect(errorsOf(valid)).toEqual({});
  });

  it("requires an uploaded image", () => {
    expect(errorsOf({ ...valid, imageUrl: "" })).toMatchObject({ imageUrl: expect.stringContaining("อัปโหลดรูป") });
  });

  it("needs an ERP SKU and a positive whole cost", () => {
    const e = errorsOf({ ...valid, erpSkuId: "", pointsCost: "0" });
    expect(e).toHaveProperty("erpSkuId");
    expect(e).toHaveProperty("pointsCost");
    expect(errorsOf({ ...valid, pointsCost: "1.5" })).toHaveProperty("pointsCost");
  });

  it("checks optional limits and the window", () => {
    expect(errorsOf({ ...valid, limitPerMember: "0" })).toHaveProperty("limitPerMember");
    expect(errorsOf({ ...valid, stockLimit: "-1" })).toHaveProperty("stockLimit");
    expect(errorsOf({ ...valid, qtyPerRedemption: "0" })).toHaveProperty("qtyPerRedemption");
    expect(errorsOf({ ...valid, availableFrom: "2026-12-01T00:00", availableTo: "2026-11-01T00:00" })).toHaveProperty(
      "availableTo",
    );
  });
});

describe("toRewardInput", () => {
  it("turns empty optional fields into null", () => {
    expect(toRewardInput(valid)).toMatchObject({
      erpSkuId: 101,
      pointsCost: 40,
      stockLimit: null,
      limitPerMember: null,
      categoryId: null,
      type: "physical",
      erpWarehouseId: 1,
      availableFrom: null,
    });
  });

  it("round-trips an existing reward", () => {
    const r: Reward = {
      id: 1, name: "ขนมไก่", description: "", imageUrl: "", categoryId: 2, type: "physical", erpSkuId: 101,
      skuCode: "CHK-01", skuName: "ขนมไก่", erpWarehouseId: 1, qtyPerRedemption: 2, pointsCost: 40, stockLimit: 0,
      limitPerMember: 3, minTierId: null, availableFrom: null, availableTo: null, status: "active", lineVisibility: { visible: true, reason: "live" }, redeemedCount: 1,
      sortOrder: 5, erpAvailableQty: 8, stockSyncedAt: null, stockStale: false, remainingQuota: 4, updatedByEmail: "",
      updatedAt: "2026-11-19T00:00:00Z",
    };
    expect(toRewardInput(toRewardFormValues(r))).toMatchObject({
      categoryId: 2, qtyPerRedemption: 2, stockLimit: 0, limitPerMember: 3, sortOrder: 5,
    });
  });

  it("describes stock", () => {
    expect(describeStock({ erpAvailableQty: null, stockSyncedAt: null })).toBe("ยังไม่ซิงก์");
    expect(describeStock({ erpAvailableQty: 1200, stockSyncedAt: null })).toBe("1,200");
  });
});

describe("params", () => {
  it("drops empty reward filters and keeps lowStock", () => {
    expect(buildRewardParams(EMPTY_REWARD_FILTERS)).toEqual({ page: 1, limit: 20 });
    expect(buildRewardParams({ ...EMPTY_REWARD_FILTERS, search: " ไก่ ", lowStock: true, categoryId: "2" })).toEqual({
      page: 1, limit: 20, search: "ไก่", lowStock: "true", categoryId: "2",
    });
  });

  it("builds redemption params", () => {
    expect(buildRedemptionParams({ ...EMPTY_REDEMPTION_FILTERS, status: "packing", dateFrom: "2026-11-01" })).toEqual({
      page: 1, limit: 20, status: "packing", dateFrom: "2026-11-01",
    });
  });
});

describe("redemption actions", () => {
  it("offers the next step and cancel only before shipping", () => {
    expect(NEXT_ACTION.pending?.action).toBe("approve");
    expect(NEXT_ACTION.packing?.action).toBe("ship");
    expect(NEXT_ACTION.delivered).toBeUndefined();
    expect(CANCELLABLE).not.toContain("shipped");
    expect(CANCELLABLE).toContain("packing");
  });
});

describe("skuOptionLabel", () => {
  it("shows code, name and ERP stock in the dropdown", async () => {
    const { skuOptionLabel } = await import("@/features/rewards/components/RewardForm");
    expect(skuOptionLabel({ code: "SKU-01", name: "อกไก่", availableQty: 1200 })).toBe("SKU-01 · อกไก่ (สต็อก 1,200)");
  });
});

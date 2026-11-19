import { describe, expect, it } from "vitest";
import { buildPromotionParams } from "@/features/promotions/api/promotionsApi";
import { EMPTY_PROMOTION_FILTERS } from "@/features/promotions/types/promotion";

describe("buildPromotionParams", () => {
  it("sends only paging for empty filters", () => {
    expect(buildPromotionParams(EMPTY_PROMOTION_FILTERS)).toEqual({ page: 1, limit: 20 });
  });

  it("trims the search and keeps the month, status and placement", () => {
    expect(
      buildPromotionParams({
        ...EMPTY_PROMOTION_FILTERS,
        search: "  โปร  ",
        month: "2026-11",
        status: "published",
        placement: "home_banner",
        page: 2,
        limit: 50,
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      search: "โปร",
      month: "2026-11",
      status: "published",
      placement: "home_banner",
    });
  });

  it("drops a whitespace-only search", () => {
    expect(buildPromotionParams({ ...EMPTY_PROMOTION_FILTERS, search: "   " })).not.toHaveProperty("search");
  });
});

import { describe, expect, it } from "vitest";
import { NAV_ITEMS, activeNavHref } from "@/components/layout/nav";

const hrefs = NAV_ITEMS.map((i) => i.href);

describe("activeNavHref", () => {
  it("lights up only the most specific menu item", () => {
    expect(activeNavHref("/coupons/redeem", hrefs)).toBe("/coupons/redeem");
    expect(activeNavHref("/coupons", hrefs)).toBe("/coupons");
    expect(activeNavHref("/coupons/12", hrefs)).toBe("/coupons");
    expect(activeNavHref("/coupons/new", hrefs)).toBe("/coupons");
  });

  it("does not match a sibling prefix or an unknown path", () => {
    expect(activeNavHref("/couponsx", hrefs)).toBeUndefined();
    expect(activeNavHref("/", hrefs)).toBeUndefined();
  });

  it("falls back to the parent when the child item is hidden", () => {
    expect(activeNavHref("/coupons/redeem", ["/coupons"])).toBe("/coupons");
  });
});

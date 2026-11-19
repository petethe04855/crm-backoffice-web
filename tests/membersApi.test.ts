import { describe, expect, it } from "vitest";
import { buildMemberParams, filenameFromDisposition } from "@/features/membership/api/membersApi";
import { EMPTY_MEMBER_FILTERS } from "@/features/membership/types/member";

describe("buildMemberParams", () => {
  it("sends only paging for empty filters", () => {
    expect(buildMemberParams(EMPTY_MEMBER_FILTERS)).toEqual({ page: 1, limit: 20 });
  });

  it("trims search and keeps set filters", () => {
    expect(
      buildMemberParams({
        ...EMPTY_MEMBER_FILTERS,
        search: "  nop ",
        status: "suspended",
        tierId: "3",
        registeredFrom: "2026-11-01",
        registeredTo: "2026-11-15",
        page: 2,
      }),
    ).toEqual({
      page: 2,
      limit: 20,
      search: "nop",
      status: "suspended",
      tierId: "3",
      registeredFrom: "2026-11-01",
      registeredTo: "2026-11-15",
    });
  });

  it("drops a whitespace-only search", () => {
    expect(buildMemberParams({ ...EMPTY_MEMBER_FILTERS, search: "   " })).not.toHaveProperty("search");
  });
});

describe("filenameFromDisposition", () => {
  it("reads the quoted filename", () => {
    expect(filenameFromDisposition('attachment; filename="members-20261116-0930.xlsx"', "x.xlsx")).toBe(
      "members-20261116-0930.xlsx",
    );
  });

  it("falls back when the header is missing", () => {
    expect(filenameFromDisposition(undefined, "members.xlsx")).toBe("members.xlsx");
  });
});

describe("buildMemberParams (M1 filters)", () => {
  it("sends point range and inactivity when set", () => {
    expect(
      buildMemberParams({ ...EMPTY_MEMBER_FILTERS, minPoints: " 100 ", maxPoints: "500", inactiveDays: "90" }),
    ).toEqual({ page: 1, limit: 20, minPoints: "100", maxPoints: "500", inactiveDays: "90" });
  });

  it("keeps a zero lower bound", () => {
    expect(buildMemberParams({ ...EMPTY_MEMBER_FILTERS, minPoints: "0" })).toHaveProperty("minPoints", "0");
  });
});

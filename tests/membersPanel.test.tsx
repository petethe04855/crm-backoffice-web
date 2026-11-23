import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MemberReport } from "@/features/sales-dashboard/types/salesDashboard";

const report: MemberReport = {
  dateFrom: "2026-11-01", dateTo: "2026-11-30", totalMembers: 120, newMembers: 12, activeMembers: 40,
  pointsEarned: 5000, pointsRedeemed: 1200, pointsExpired: 0, pointsAdjusted: 0, pointsRefunded: 0, outstandingPoints: 3800,
  months: [{ month: "2026-11", newMembers: 12, pointsEarned: 5000, pointsRedeemed: 1200, pointsExpired: 0 }],
  genders: [{ gender: "female", members: 8, sharePercent: 66.7 }, { gender: "male", members: 4, sharePercent: 33.3 }],
  ageBuckets: [{ key: "25-34", label: "25–34 ปี", members: 12, sharePercent: 100 }],
  firstSkus: [],
  firstRewards: [{ rewardId: 1, rewardName: "กระเป๋าผ้า", members: 2, sharePercent: 100 }],
  redemptions: 3, redemptionMembers: 2,
  rewards: [{ rewardId: 1, rewardName: "กระเป๋าผ้า", redemptions: 2, qty: 2, points: 1000, sharePercent: 66.7 }],
};

vi.mock("@/features/sales-dashboard/hooks/useSalesDashboard", () => ({
  useMemberReport: () => ({ data: report, isError: false, error: null }),
}));

describe("MembersPanel", () => {
  it("shows signups, gender, age and the rewards members redeemed", async () => {
    const { MembersPanel } = await import("@/features/sales-dashboard/components/panels/MembersPanel");
    render(<MembersPanel filters={{ dateFrom: "2026-11-01", dateTo: "2026-11-30", channel: "all", region: "" } as never} />);
    expect(screen.getByText("สมัครใหม่ในช่วงนี้")).toBeInTheDocument();
    expect(screen.getByText("3 ครั้ง")).toBeInTheDocument();
    expect(screen.getByText(/จากสมาชิก 2 คน/)).toBeInTheDocument();
    expect(screen.getByText("หญิง")).toBeInTheDocument();
    // charts: gender legend, age column, ranked reward bar (and its table view)
    expect(screen.getByText(/8 คน · 66.7%/)).toBeInTheDocument();
    expect(screen.getByText("25–34")).toBeInTheDocument();
    expect(screen.getByLabelText("25–34: 25–34 ปี · 12 คน · 100.0%")).toBeInTheDocument();
    expect(screen.getByText("2 ครั้ง")).toBeInTheDocument();
    const row = screen.getAllByText("กระเป๋าผ้า").map((el) => el.closest("tr")).find(Boolean)!;
    expect(within(row).getByText("66.7%")).toBeInTheDocument();
  });
});

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (sel: (s: { session: unknown }) => unknown) => sel({ session: {} }),
  hasPermission: () => true,
}));

describe("SalesDashboardView", () => {
  it("shows only the date filter and the member stats", async () => {
    const { SalesDashboardView } = await import("@/features/sales-dashboard/components/SalesDashboardView");
    render(<SalesDashboardView />);
    expect(screen.getByLabelText("ช่วงวันที่")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 วัน" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "แดชบอร์ด" })).toBeNull(); // no tab rail
    expect(screen.queryByLabelText("ภูมิภาค")).toBeNull();
    expect(screen.queryByRole("button", { name: /Shopee/ })).toBeNull();
    expect(screen.getByText("สมัครใหม่ในช่วงนี้")).toBeInTheDocument();
  });
});

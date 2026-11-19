import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardTabs } from "@/features/sales-dashboard/components/DashboardTabs";
import { TAB_EXPORTS } from "@/features/sales-dashboard/components/SalesDashboardView";

describe("TAB_EXPORTS", () => {
  it("offers an export on every sales tab and none on the members tab", () => {
    for (const tab of ["sales", "cust", "behav", "flavors", "geo"] as const) {
      expect(TAB_EXPORTS[tab].length).toBeGreaterThan(0);
    }
    expect(TAB_EXPORTS.members).toEqual([]);
    expect(TAB_EXPORTS.behav.map((e) => e.section)).toEqual(["timing", "repurchase"]);
  });
});

describe("DashboardTabs", () => {
  it("shows the CRM members tab only with reports.view", () => {
    const { rerender } = render(<DashboardTabs active="sales" showCustomers onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /สมาชิก CRM/ })).toBeNull();
    rerender(<DashboardTabs active="sales" showCustomers showMembers onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /สมาชิก CRM/ })).toBeInTheDocument();
  });
});

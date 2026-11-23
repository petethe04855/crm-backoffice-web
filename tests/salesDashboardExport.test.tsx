import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesDashboardView } from "@/features/sales-dashboard/components/SalesDashboardView";

describe("SalesDashboardView chrome", () => {
  it("renders the shared backoffice header and no ERP sales tab rail", () => {
    render(<SalesDashboardView />);
    // Shared PageHeader, like every other page.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "สมาชิกและการแลกของรางวัล",
    );
    expect(screen.getByText(/Chawy · CRM backoffice/)).toBeInTheDocument();
    // No marketplace tabs: this screen is CRM members only.
    expect(screen.queryByRole("navigation", { name: "แดชบอร์ด" })).toBeNull();
    expect(screen.queryByRole("button", { name: /ภาพรวมยอดขาย/ })).toBeNull();
  });
});
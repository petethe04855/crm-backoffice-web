import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { SalesDashboardView } from "@/features/sales-dashboard/components/SalesDashboardView";
import "@/features/sales-dashboard/styles/sales-dashboard.css";

export default function SalesDashboardPage() {
  return (
    <RequirePermission permission={PERMISSIONS.salesDashboardView}>
      <SalesDashboardView />
    </RequirePermission>
  );
}

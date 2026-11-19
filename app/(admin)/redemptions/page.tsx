import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { RedemptionListView } from "@/features/rewards/components/RedemptionViews";

export default function RedemptionsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.redemptionsFulfill}>
      <RedemptionListView />
    </RequirePermission>
  );
}

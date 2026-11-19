import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { RewardDetailView } from "@/features/rewards/components/RedemptionViews";

export default function RewardDetailPage() {
  return (
    <RequirePermission permission={PERMISSIONS.rewardsView}>
      <RewardDetailView />
    </RequirePermission>
  );
}

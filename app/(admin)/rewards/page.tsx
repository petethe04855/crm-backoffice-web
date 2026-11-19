import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { RewardListView } from "@/features/rewards/components/RewardListView";

export default function RewardsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.rewardsView}>
      <RewardListView />
    </RequirePermission>
  );
}

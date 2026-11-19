import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { RewardForm } from "@/features/rewards/components/RewardForm";

export default function NewRewardPage() {
  return (
    <RequirePermission permission={PERMISSIONS.rewardsManage}>
      <RewardForm canManage />
    </RequirePermission>
  );
}

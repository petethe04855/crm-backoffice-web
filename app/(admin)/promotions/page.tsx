import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { PromotionListView } from "@/features/promotions/components/PromotionListView";

export default function PromotionsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.promotionsView}>
      <PromotionListView />
    </RequirePermission>
  );
}

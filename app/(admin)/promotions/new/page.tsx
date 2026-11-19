import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { PromotionForm } from "@/features/promotions/components/PromotionForm";

export default function NewPromotionPage() {
  return (
    <RequirePermission permission={PERMISSIONS.promotionsManage}>
      <PromotionForm canManage />
    </RequirePermission>
  );
}

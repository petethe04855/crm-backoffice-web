import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { PromotionDetailView } from "@/features/promotions/components/PromotionDetailView";

export default async function PromotionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequirePermission permission={PERMISSIONS.promotionsView}>
      <PromotionDetailView id={id} />
    </RequirePermission>
  );
}

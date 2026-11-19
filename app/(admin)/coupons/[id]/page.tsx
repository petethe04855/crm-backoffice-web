import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CouponDetailView } from "@/features/coupons/components/CouponDetailView";

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequirePermission permission={PERMISSIONS.couponsView}>
      <CouponDetailView id={Number(id)} />
    </RequirePermission>
  );
}

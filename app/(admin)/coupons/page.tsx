import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CouponListView } from "@/features/coupons/components/CouponListView";

export default function CouponsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.couponsView}>
      <CouponListView />
    </RequirePermission>
  );
}

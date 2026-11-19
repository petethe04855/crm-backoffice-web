import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CouponRedeemView } from "@/features/coupons/components/CouponRedeemView";

export default function CouponRedeemPage() {
  return (
    <RequirePermission permission={PERMISSIONS.couponsUse}>
      <CouponRedeemView />
    </RequirePermission>
  );
}

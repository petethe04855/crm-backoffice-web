import { PageHeader } from "@/components/layout/PageHeader";
import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CouponForm } from "@/features/coupons/components/CouponForm";

export default function NewCouponPage() {
  return (
    <RequirePermission permission={PERMISSIONS.couponsManage}>
      <div className="space-y-6">
        <PageHeader title="สร้างคูปอง" description="บันทึกเป็นฉบับร่างก่อน แล้วกดเปิดให้แลกในหน้ารายละเอียด" />
        <CouponForm canManage />
      </div>
    </RequirePermission>
  );
}

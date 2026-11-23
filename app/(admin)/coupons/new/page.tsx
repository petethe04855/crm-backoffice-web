import { PageHeader } from "@/components/layout/PageHeader";
import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CouponForm } from "@/features/coupons/components/CouponForm";

export default function NewCouponPage() {
  return (
    <RequirePermission permission={PERMISSIONS.couponsManage}>
      <div className="space-y-6">
        <PageHeader title="สร้างคูปอง" description="กด “บันทึกและแสดงใน LINE OA” เพื่อเปิดให้สมาชิกแลกทันที หรือบันทึกเป็นฉบับร่างไว้ก่อน" />
        <CouponForm canManage />
      </div>
    </RequirePermission>
  );
}

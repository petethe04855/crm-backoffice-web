import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { PromotionCalendar } from "@/features/promotions/components/PromotionCalendar";

export default function PromotionCalendarPage() {
  return (
    <RequirePermission permission={PERMISSIONS.promotionsView}>
      <PromotionCalendar />
    </RequirePermission>
  );
}

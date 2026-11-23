import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CodeControlsView } from "@/features/product-codes/components/CodeControlsView";

export default function ProductCodeSettingsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.productCodesManage}>
      <CodeControlsView />
    </RequirePermission>
  );
}

import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { ProductCodeBatchesView } from "@/features/product-codes/components/ProductCodeBatchesView";

export default function ProductCodesPage() {
  return (
    <RequirePermission permission={PERMISSIONS.productCodesManage}>
      <ProductCodeBatchesView />
    </RequirePermission>
  );
}

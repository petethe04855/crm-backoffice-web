import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { CreateBatchView } from "@/features/product-codes/components/CreateBatchView";

export default function NewProductCodeBatchPage() {
  return (
    <RequirePermission permission={PERMISSIONS.productCodesManage}>
      <CreateBatchView />
    </RequirePermission>
  );
}

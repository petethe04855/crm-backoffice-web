import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { BatchDetailView } from "@/features/product-codes/components/BatchDetailView";

export default async function ProductCodeBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequirePermission permission={PERMISSIONS.productCodesManage}>
      <BatchDetailView id={Number(id)} />
    </RequirePermission>
  );
}

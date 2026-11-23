import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { DataRequestsView } from "@/features/data-requests/components/DataRequestsView";

export default function DataRequestsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.membersManage}>
      <DataRequestsView />
    </RequirePermission>
  );
}

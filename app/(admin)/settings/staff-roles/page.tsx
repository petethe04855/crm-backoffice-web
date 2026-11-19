import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { StaffRolesView } from "@/features/staff-roles/components/StaffRolesView";

export default function StaffRolesPage() {
  return (
    <RequirePermission permission={PERMISSIONS.staffRolesManage}>
      <StaffRolesView />
    </RequirePermission>
  );
}

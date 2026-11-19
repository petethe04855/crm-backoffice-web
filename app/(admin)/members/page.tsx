import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { MemberListView } from "@/features/membership/components/MemberListView";

export default function MembersPage() {
  return (
    <RequirePermission permission={PERMISSIONS.membersView}>
      <MemberListView />
    </RequirePermission>
  );
}

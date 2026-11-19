import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { MemberDetailView } from "@/features/membership/components/MemberDetailView";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequirePermission permission={PERMISSIONS.membersView}>
      <MemberDetailView id={Number(id)} />
    </RequirePermission>
  );
}

import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { ConsentDocumentsView } from "@/features/consents/components/ConsentDocumentsView";

export default function ConsentDocumentsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.consentsManage}>
      <ConsentDocumentsView />
    </RequirePermission>
  );
}

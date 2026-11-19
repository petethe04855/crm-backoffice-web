import { RequirePermission } from "@/features/auth/components/RequirePermission";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { PointSettingsView } from "@/features/point-rules/components/PointSettingsView";

export default function PointsSettingsPage() {
  return (
    <RequirePermission permission={PERMISSIONS.settingsView}>
      <PointSettingsView />
    </RequirePermission>
  );
}

import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { SessionGuard } from "@/features/auth/components/SessionGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard>
      <AdminShell>{children}</AdminShell>
    </SessionGuard>
  );
}

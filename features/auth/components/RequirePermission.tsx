"use client";

import type { ReactNode } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { hasPermission, useAuthStore } from "@/stores/authStore";

/** Hides a page from staff without the permission (the API enforces it too). */
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  if (!hasPermission(session, permission)) {
    return <ErrorState title="ไม่มีสิทธิ์เข้าถึง" message="บัญชีของคุณไม่มีสิทธิ์ใช้งานหน้านี้" />;
  }
  return <>{children}</>;
}

"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loading } from "@/components/common/Loading";
import { getToken } from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "../api/authApi";

/** Verifies the stored token with GET /crm/me before rendering admin pages. */
export function SessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (session) return;
    const toLogin = () => router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (!getToken()) {
      logout();
      toLogin();
      return;
    }
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setSession(me);
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        toLogin();
      });
    return () => {
      cancelled = true;
    };
  }, [session, setSession, logout, router, pathname]);

  if (!session) return <Loading message="กำลังตรวจสอบสิทธิ์…" />;
  return <>{children}</>;
}

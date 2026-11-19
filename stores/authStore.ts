import { create } from "zustand";
import { TOKEN_KEY, setUnauthorizedListener } from "@/lib/axios";
import type { StaffSession } from "@/features/auth/types/auth";

/**
 * Session-presence cookie read by proxy.ts (the Edge proxy cannot read
 * localStorage). It holds no secret; backoffice-api validates the JWT on
 * every request.
 */
export const AUTH_COOKIE = "crm_bo_auth";

function writeCookie(value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH_COOKIE}=${value}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

interface AuthState {
  session: StaffSession | null;
  checked: boolean;
  setSession: (session: StaffSession, token?: string) => void;
  markChecked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  checked: false,
  setSession: (session, token) => {
    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        /* storage blocked: the session lasts for this page only */
      }
    }
    writeCookie("1", 24 * 60 * 60);
    set({ session, checked: true });
  },
  markChecked: () => set({ checked: true }),
  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    writeCookie("", 0);
    set({ session: null, checked: true });
  },
}));

setUnauthorizedListener(() => useAuthStore.getState().logout());

/** True when the signed-in staff member holds the permission. */
export function hasPermission(session: StaffSession | null, permission: string): boolean {
  return Boolean(session?.permissions.includes(permission));
}

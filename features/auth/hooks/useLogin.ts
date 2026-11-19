"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "../api/authApi";
import type { LoginInput } from "../types/auth";

/**
 * Logs in through the ERP, then asks backoffice-api for CRM permissions.
 * The token is stored only after the CRM accepts it.
 */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await authApi.erpLogin(input);
      if (result.user.mustResetPassword) {
        throw new Error("กรุณาเปลี่ยนรหัสผ่านในระบบ ERP ก่อนเข้าใช้งาน CRM");
      }
      const session = await authApi.me(result.token);
      if (session.permissions.length === 0) {
        throw new Error("บัญชีนี้ไม่มีสิทธิ์ใช้งานระบบหลังบ้าน CRM");
      }
      return { session, token: result.token };
    },
    onSuccess: ({ session, token }) => setSession(session, token),
  });
}

import { crmClient, erpAuthClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ErpLoginResult, LoginInput, StaffSession } from "../types/auth";

export const authApi = {
  /** Staff log in with their ERP account; the ERP issues the JWT. */
  async erpLogin(input: LoginInput): Promise<ErpLoginResult> {
    const { data } = await erpAuthClient.post<ApiResponse<ErpLoginResult>>("/auth/login", input);
    return data.data;
  },

  /** Effective CRM roles and permissions for the current token. */
  async me(token?: string): Promise<StaffSession> {
    const { data } = await crmClient.get<ApiResponse<StaffSession>>("/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data.data;
  },
};

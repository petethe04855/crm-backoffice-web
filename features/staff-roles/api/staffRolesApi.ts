import { crmClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { GrantStaffRoleInput, StaffRole } from "../types/staffRole";

export const staffRolesApi = {
  async list(): Promise<StaffRole[]> {
    const { data } = await crmClient.get<ApiResponse<StaffRole[]>>("/staff-roles");
    return data.data;
  },
  async grant({ erpUserId, email, role }: GrantStaffRoleInput): Promise<StaffRole> {
    const { data } = await crmClient.put<ApiResponse<StaffRole>>(`/staff-roles/${erpUserId}`, { email, role });
    return data.data;
  },
  async revoke(erpUserId: number): Promise<void> {
    await crmClient.delete(`/staff-roles/${erpUserId}`);
  },
};

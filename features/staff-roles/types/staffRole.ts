export interface StaffRole {
  erpUserId: number;
  email: string;
  role: "admin";
  grantedBy: number;
  grantedAt: string;
}

export interface GrantStaffRoleInput {
  erpUserId: number;
  email: string;
  role: "admin";
}

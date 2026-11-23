/** The signed-in staff member as backoffice-api sees them (GET /crm/me). */
export interface StaffSession {
  erpUserId: number;
  email: string;
  roles: string[];
  permissions: string[];
}

/** erp-api-v2 POST /auth/login response data. */
export interface ErpLoginResult {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    mustResetPassword: boolean;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Permission names (mirror backoffice-api internal/authz). */
export const PERMISSIONS = {
  membersView: "members.view",
  membersExport: "members.export",
  membersManage: "members.manage",
  membersNotes: "members.notes",
  pointsView: "points.view",
  pointsAdjust: "points.adjust",
  staffRolesManage: "staff_roles.manage",
  salesDashboardView: "sales_dashboard.view",
  salesDashboardCustomers: "sales_dashboard.customers",
  // Reserved by T1 for the module tasks (plan §11).
  promotionsView: "promotions.view",
  promotionsManage: "promotions.manage",
  rewardsView: "rewards.view",
  rewardsManage: "rewards.manage",
  redemptionsFulfill: "redemptions.fulfill",
  reportsView: "reports.view",
  couponsView: "coupons.view",
  couponsManage: "coupons.manage",
  couponsUse: "coupons.use",
  settingsView: "settings.view",
  settingsManage: "settings.manage",
  consentsManage: "consents.manage",
  productCodesManage: "product_codes.manage",
  productCodesExport: "product_codes.export",
} as const;

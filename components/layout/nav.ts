import {
  BarChart3,
  FileCheck2,
  KeyRound,
  UserX,
  Gift,
  Megaphone,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "@/features/auth/types/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The staff member needs this permission to see the item. */
  permission: string;
}

/**
 * Sidebar menu. Modules append their entry here instead of editing
 * AdminShell; the shell only filters and renders the list.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/sales-dashboard",
    label: "ยอดขาย",
    icon: BarChart3,
    permission: PERMISSIONS.salesDashboardView,
  },
  { href: "/members", label: "สมาชิก", icon: Users, permission: PERMISSIONS.membersView },
  // { href: "/members/data-requests", label: "คำขอลบบัญชี", icon: UserX, permission: PERMISSIONS.membersManage },
  { href: "/promotions", label: "โปรโมชั่น", icon: Megaphone, permission: PERMISSIONS.promotionsView },
  { href: "/rewards", label: "ของรางวัล", icon: Gift, permission: PERMISSIONS.rewardsView },
  { href: "/redemptions", label: "การแลกรางวัล", icon: Truck, permission: PERMISSIONS.redemptionsFulfill },
  // { href: "/coupons", label: "คูปอง", icon: Ticket, permission: PERMISSIONS.couponsView },
  // { href: "/coupons/redeem", label: "กดใช้คูปอง", icon: ScanLine, permission: PERMISSIONS.couponsUse },
  { href: "/product-codes", label: "รหัสสินค้า", icon: KeyRound, permission: PERMISSIONS.productCodesManage },
  
  {
    href: "/settings/points",
    label: "ตั้งค่าแต้ม",
    icon: SlidersHorizontal,
    permission: PERMISSIONS.settingsView,
  },
  {
    href: "/settings/consents",
    label: "เอกสารความยินยอม",
    icon: FileCheck2,
    permission: PERMISSIONS.consentsManage,
  },
  {
    href: "/settings/staff-roles",
    label: "ผู้ใช้ CRM",
    icon: ShieldCheck,
    permission: PERMISSIONS.staffRolesManage,
  },
];

/**
 * The href of the menu item for this path: the longest href that is the path
 * or a parent of it, so /coupons/redeem lights up "กดใช้คูปอง" and not "คูปอง".
 */
export function activeNavHref(pathname: string, hrefs: string[]): string | undefined {
  let best: string | undefined;
  for (const href of hrefs) {
    const match = pathname === href || pathname.startsWith(`${href}/`);
    if (match && (!best || href.length > best.length)) best = href;
  }
  return best;
}

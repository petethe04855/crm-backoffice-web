import {
  BarChart3,
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
  { href: "/members", label: "สมาชิก", icon: Users, permission: PERMISSIONS.membersView },
  { href: "/promotions", label: "โปรโมชั่น", icon: Megaphone, permission: PERMISSIONS.promotionsView },
  { href: "/rewards", label: "ของรางวัล", icon: Gift, permission: PERMISSIONS.rewardsView },
  { href: "/redemptions", label: "การแลกรางวัล", icon: Truck, permission: PERMISSIONS.redemptionsFulfill },
  { href: "/coupons", label: "คูปอง", icon: Ticket, permission: PERMISSIONS.couponsView },
  { href: "/coupons/redeem", label: "กดใช้คูปอง", icon: ScanLine, permission: PERMISSIONS.couponsUse },
  {
    href: "/sales-dashboard",
    label: "ยอดขาย",
    icon: BarChart3,
    permission: PERMISSIONS.salesDashboardView,
  },
  {
    href: "/settings/points",
    label: "ตั้งค่าแต้ม",
    icon: SlidersHorizontal,
    permission: PERMISSIONS.settingsView,
  },
  {
    href: "/settings/staff-roles",
    label: "ผู้ใช้ CRM",
    icon: ShieldCheck,
    permission: PERMISSIONS.staffRolesManage,
  },
];

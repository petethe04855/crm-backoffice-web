"use client";

import { cn } from "@/lib/utils";

export type DashboardTab = "sales" | "cust" | "behav" | "flavors" | "geo" | "members";

const TABS: { key: DashboardTab; label: string; icon: string }[] = [
  { key: "sales", label: "ภาพรวมยอดขาย", icon: "📈" },
  { key: "cust", label: "ลูกค้า", icon: "👥" },
  { key: "behav", label: "พฤติกรรม", icon: "🕒" },
  { key: "flavors", label: "สินค้าและรสชาติ", icon: "🍗" },
  { key: "geo", label: "ภูมิภาค", icon: "🗺️" },
  { key: "members", label: "สมาชิกและการแลก", icon: "🎫" },
];

/**
 * Tab rail in the same pill style the rest of the backoffice uses. The buyer
 * tab is hidden from roles without sales_dashboard.customers, and the members
 * tab needs reports.view.
 */
export function DashboardTabs({
  active,
  showCustomers,
  showMembers = false,
  onChange,
}: {
  active: DashboardTab;
  showCustomers: boolean;
  showMembers?: boolean;
  onChange: (tab: DashboardTab) => void;
}) {
  const visible = TABS.filter(
    (tab) =>
      (tab.key !== "cust" || showCustomers) && (tab.key !== "members" || showMembers),
  );
  return (
    <nav
      aria-label="แดชบอร์ด"
      className="mb-6 flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm"
    >
      {visible.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            type="button"
            key={tab.key}
            aria-pressed={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-neutral-900 font-medium text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
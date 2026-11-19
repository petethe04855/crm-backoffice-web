"use client";

export type DashboardTab = "sales" | "cust" | "behav" | "flavors" | "geo" | "members";

const TABS: { key: DashboardTab; label: string; icon: string; className: string }[] = [
  { key: "sales", label: "ภาพรวมยอดขาย", icon: "📈", className: "tab-sales" },
  { key: "cust", label: "ลูกค้า", icon: "👥", className: "tab-cust" },
  { key: "behav", label: "พฤติกรรม", icon: "🕒", className: "tab-behav" },
  { key: "flavors", label: "สินค้าและรสชาติ", icon: "🍗", className: "tab-flavors" },
  { key: "geo", label: "ภูมิภาค", icon: "🗺️", className: "tab-geo" },
  { key: "members", label: "สมาชิก CRM", icon: "🎫", className: "tab-cust" },
];

/** Tab rail. The buyer tab is hidden from roles without sales_dashboard.customers. */
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
  return (
    <div className="nav-tabs-wrapper">
      <div className="container">
        <nav className="nav-tabs" aria-label="แดชบอร์ด">
          {TABS.filter((tab) => (tab.key !== "cust" || showCustomers) && (tab.key !== "members" || showMembers)).map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`nav-tab-btn ${tab.className}${active === tab.key ? " active" : ""}`}
              aria-pressed={active === tab.key}
              onClick={() => onChange(tab.key)}
            >
              <span aria-hidden>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { CustomerModal } from "./CustomerModal";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardTabs, type DashboardTab } from "./DashboardTabs";
import { FilterBar } from "./FilterBar";
import { BehaviorPanel } from "./panels/BehaviorPanel";
import { CustomerPanel } from "./panels/CustomerPanel";
import { FlavorPanel } from "./panels/FlavorPanel";
import { GeographyPanel } from "./panels/GeographyPanel";
import { MembersPanel } from "./panels/MembersPanel";
import { OverviewPanel } from "./panels/OverviewPanel";
import { ExportButton } from "@/components/common/ExportButton";
import { salesDashboardApi, type SalesExportSection } from "../api/salesDashboardApi";
import { useSalesDashboard } from "../hooks/useSalesDashboard";
import { PRESETS, bangkokToday, defaultFilters, type DateRange, type PresetKey } from "../lib/dashboard";
import type { SalesCustomer, SalesFilters } from "../types/salesDashboard";

/** Excel exports offered under each tab (the API applies the same filters). */
export const TAB_EXPORTS: Record<DashboardTab, { section: SalesExportSection; label: string }[]> = {
  sales: [{ section: "summary", label: "ส่งออกภาพรวม (Excel)" }],
  cust: [{ section: "customers", label: "ส่งออกลูกค้า (Excel)" }],
  behav: [
    { section: "timing", label: "ส่งออกช่วงเวลา (Excel)" },
    { section: "repurchase", label: "ส่งออกการซื้อซ้ำ (Excel)" },
  ],
  flavors: [{ section: "products", label: "ส่งออกสินค้า/รสชาติ (Excel)" }],
  geo: [{ section: "provinces", label: "ส่งออกจังหวัด (Excel)" }],
  members: [],
};

/**
 * Sales dashboard shell: one report query drives five tabs, and the buyer
 * drill-down is a separate query. All numbers come from backoffice-api; this
 * view only filters, formats and renders.
 */
export function SalesDashboardView() {
  const session = useAuthStore((s) => s.session);
  const showCustomers = hasPermission(session, PERMISSIONS.salesDashboardCustomers);
  const showMembers = hasPermission(session, PERMISSIONS.reportsView);

  const [filters, setFilters] = useState<SalesFilters>(() => defaultFilters());
  const [draft, setDraft] = useState<DateRange>(() => ({ from: filters.dateFrom, to: filters.dateTo }));
  const [tab, setTab] = useState<DashboardTab>("sales");
  const [customer, setCustomer] = useState<SalesCustomer | null>(null);

  const report = useSalesDashboard(filters);

  const applyPreset = (key: PresetKey) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const range = preset.range(bangkokToday());
    setFilters((prev) => ({ ...prev, dateFrom: range.from, dateTo: range.to }));
    setDraft(range);
  };

  const reset = () => {
    const next = defaultFilters();
    setFilters(next);
    setDraft({ from: next.dateFrom, to: next.dateTo });
  };

  return (
    <div className="sd-root">
      <DashboardHeader range={report.data?.range} masked={report.data?.masked} />
      <DashboardTabs active={tab} showCustomers={showCustomers} showMembers={showMembers} onChange={setTab} />

      <FilterBar
        filters={filters}
        draft={draft}
        summary={report.data?.summary}
        fetching={report.isFetching}
        onDraftChange={setDraft}
        onApply={() => setFilters((prev) => ({ ...prev, dateFrom: draft.from, dateTo: draft.to }))}
        onPreset={applyPreset}
        onChannel={(channel) => setFilters((prev) => ({ ...prev, channel }))}
        onRegion={(region) => setFilters((prev) => ({ ...prev, region }))}
        onReset={reset}
      />

      {report.isError && (
        <div className="container">
          <div className="section-card">
            <p className="sd-error">{(report.error as Error).message}</p>
            <button type="button" className="sd-btn-ghost" style={{ marginTop: 12 }} onClick={() => report.refetch()}>
              ลองอีกครั้ง
            </button>
          </div>
        </div>
      )}

      {report.isPending && !report.data && (
        <div className="container">
          <div className="sd-loading">กำลังโหลดข้อมูลยอดขาย…</div>
        </div>
      )}

      {tab === "members" && showMembers && <MembersPanel filters={filters} />}

      {report.data && tab !== "members" && (
        <div className={report.isFetching ? "sd-fetching" : undefined}>
          {tab === "sales" && <OverviewPanel report={report.data} onOpenCustomer={setCustomer} />}
          {tab === "cust" && showCustomers && (
            <CustomerPanel report={report.data} showCustomers={showCustomers} onOpenCustomer={setCustomer} />
          )}
          {tab === "behav" && <BehaviorPanel report={report.data} />}
          {tab === "flavors" && <FlavorPanel report={report.data} />}
          {tab === "geo" && <GeographyPanel report={report.data} />}
          <div className="container">
            <div className="flex flex-wrap justify-end gap-2 py-3">
              {TAB_EXPORTS[tab].map(({ section, label }) => (
                <ExportButton
                  key={section}
                  label={label}
                  onExport={() => salesDashboardApi.exportSection(section, filters)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        ข้อมูลจาก ERP · คำนวณ KPI ที่ CRM Core · โซนเวลา Asia/Bangkok
      </footer>

      {showCustomers && (
        <CustomerModal customer={customer} filters={filters} onClose={() => setCustomer(null)} />
      )}
    </div>
  );
}

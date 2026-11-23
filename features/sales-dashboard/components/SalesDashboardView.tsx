"use client";

import { useState } from "react";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { FilterBar } from "./FilterBar";
import { MembersPanel } from "./panels/MembersPanel";
import { PRESETS, bangkokToday, defaultFilters, daysInclusive, type DateRange, type PresetKey } from "../lib/dashboard";
import type { SalesFilters } from "../types/salesDashboard";
import { formatThaiDate } from "@/lib/thaiDate";

/**
 * Member report screen. Everything here comes from CRM (GET /reports/members):
 * who signed up, split by gender and age, and the SKU each member typed a
 * product code for first. Nothing is read from ERP — there is no marketplace
 * sales data on this screen.
 *
 * The chrome is the shared backoffice one (PageHeader + SearchPanel sidebar),
 * so it matches the rest of the app.
 */
export function SalesDashboardView() {
  const session = useAuthStore((s) => s.session);
  const canView = hasPermission(session, PERMISSIONS.reportsView);

  const [filters, setFilters] = useState<SalesFilters>(() => defaultFilters());
  const [draft, setDraft] = useState<DateRange>(() => ({ from: filters.dateFrom, to: filters.dateTo }));

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
      <PageHeader
        title="สมาชิกและการแลกของรางวัล"
        description="ผู้สมัคร LINE OA แยกเพศ อายุ และ SKU แรกที่กรอกรหัส — ข้อมูลจาก CRM"
        actions={
          <div className="text-right text-sm text-neutral-500">
            <p className="font-medium text-neutral-700">
              {formatThaiDate(filters.dateFrom)} – {formatThaiDate(filters.dateTo)}
            </p>
            <p className="mt-1 text-xs">{daysInclusive(filters.dateFrom, filters.dateTo)} วัน</p>
          </div>
        }
      />

      {!canView ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          ต้องมีสิทธิ์ดูรายงาน (reports.view) เพื่อเปิดหน้านี้
        </div>
      ) : (
        <TwoColumnLayout
          sidebar={
            <FilterBar
              filters={filters}
              draft={draft}
              fetching={false}
              onDraftChange={setDraft}
              onApply={() =>
                setFilters((prev) => ({ ...prev, dateFrom: draft.from, dateTo: draft.to }))
              }
              onPreset={applyPreset}
              onReset={reset}
            />
          }
          content={<MembersPanel filters={filters} />}
        />
      )}

      <p className="mt-6 text-xs text-neutral-400">
        ข้อมูลจาก CRM · โซนเวลา Asia/Bangkok
      </p>
    </div>
  );
}
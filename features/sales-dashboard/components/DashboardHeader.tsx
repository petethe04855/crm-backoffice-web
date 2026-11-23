"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { formatRange } from "../lib/dashboard";
import type { SalesRange } from "../types/salesDashboard";

/**
 * Page header of the dashboard, built on the shared PageHeader so it matches
 * every other backoffice screen. The range and the PDPA state sit in the
 * actions slot, where the other pages put their buttons.
 */
export function DashboardHeader({ range, masked }: { range?: SalesRange; masked?: boolean }) {
  return (
    <PageHeader
      title="สมาชิกและการแลกของรางวัล"
      description="ผู้สมัคร LINE OA แยกเพศ อายุ และ SKU แรกที่กรอกรหัส"
      actions={
        <div className="text-right text-sm text-neutral-500">
          <p className="font-medium text-neutral-700">
            {range ? formatRange(range.from, range.to) : "—"}
          </p>
          <p className="mt-1 text-xs">
            {range ? `${range.days} วัน` : ""}
            {masked ? " · ซ่อนข้อมูลส่วนบุคคล" : ""}
          </p>
        </div>
      }
    />
  );
}
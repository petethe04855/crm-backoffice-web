"use client";

import { formatRange } from "../lib/dashboard";
import type { SalesRange } from "../types/salesDashboard";

/** Executive header of the dashboard: range, channel and PDPA state. */
export function DashboardHeader({ range, masked }: { range?: SalesRange; masked?: boolean }) {
  return (
    <div className="top-header">
      <div className="container">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo-badge" aria-hidden>
              📊
            </div>
            <div>
              <h1 className="header-title">ยอดขายและพฤติกรรมลูกค้า</h1>
              <p className="header-subtitle">Shopee · TikTok · ข้อมูลจาก ERP แบบเรียลไทม์ (แคช 10 นาที)</p>
            </div>
          </div>
          <div className="header-subtitle" style={{ textAlign: "right" }}>
            <div>{range ? formatRange(range.from, range.to) : "—"}</div>
            <div>
              {range ? `${range.days} วัน` : ""} {masked ? "· ซ่อนข้อมูลส่วนบุคคล" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

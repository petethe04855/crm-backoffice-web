"use client";

import { useMemo, useState } from "react";
import { MetricBar, CHANNEL_COLORS } from "../Charts";
import { formatBaht, formatNumber, formatPercent } from "../../lib/dashboard";
import type { SalesReport } from "../../types/salesDashboard";

const PAGE_SIZE = 12;

/** Geography tab: region roll-up and the province table. */
export function GeographyPanel({ report }: { report: SalesReport }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return report.provinces;
    return report.provinces.filter(
      (p) => p.province.toLowerCase().includes(q) || p.region.toLowerCase().includes(q),
    );
  }, [report.provinces, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className="tab-panel active">
      <div className="container">
        <div className="section-card" style={{ marginTop: 24 }}>
          <div className="section-title-wrap">
            <h3 className="chart-title">ภาพรวมตามภูมิภาค</h3>
            <p>ยอดขายและสัดส่วนของแต่ละภูมิภาค (จังหวัด normalize ตามข้อมูล ERP)</p>
          </div>
          {report.regions.length === 0 && <p className="sd-note">ไม่มีข้อมูลภูมิภาคในช่วงนี้</p>}
          <div className="sd-barlist">
            {report.regions.map((region) => (
              <MetricBar
                key={region.region}
                label={`${region.region} · ${region.provinceCount} จังหวัด`}
                value={`${formatBaht(region.sales)} · ${formatPercent(region.sharePercent)}`}
                share={region.sharePercent}
                color={CHANNEL_COLORS.cyan}
              />
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">รายจังหวัด</h3>
            <p>
              {formatNumber(filtered.length)} จังหวัด · ยอดรวม{" "}
              {formatBaht(filtered.reduce((sum, p) => sum + p.sales, 0))}
            </p>
          </div>
          <div className="table-controls">
            <input
              className="search-box"
              type="search"
              placeholder="ค้นหาจังหวัดหรือภูมิภาค"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>จังหวัด</th>
                  <th>ภูมิภาค</th>
                  <th>ผู้ซื้อ</th>
                  <th>ออเดอร์</th>
                  <th>ยอดขาย</th>
                  <th>เฉลี่ย/ออเดอร์</th>
                  <th>สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((province, index) => (
                  <tr key={`${province.region}-${province.province}`}>
                    <td>{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                    <td>{province.province}</td>
                    <td>{province.region}</td>
                    <td>{formatNumber(province.buyers)}</td>
                    <td>{formatNumber(province.orders)}</td>
                    <td className="money-val">{formatBaht(province.sales)}</td>
                    <td>{formatBaht(province.aov)}</td>
                    <td>{formatPercent(province.sharePercent)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 28 }}>
                      {report.provinces.length === 0 ? "ไม่มีข้อมูลจังหวัดในช่วงนี้" : "ไม่พบจังหวัดที่ตรงกับคำค้น"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span>
              ทั้งหมด {formatNumber(filtered.length)} จังหวัด · หน้า {safePage}/{pages}
            </span>
            <div className="pagination-btns">
              <button type="button" className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                ← ก่อนหน้า
              </button>
              <button type="button" className="page-btn" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>
                ถัดไป →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

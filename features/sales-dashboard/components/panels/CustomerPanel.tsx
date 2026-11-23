"use client";

import { useMemo, useState } from "react";
import { formatBaht, formatNumber } from "../../lib/dashboard";
import type { SalesCustomer, SalesReport } from "../../types/salesDashboard";

const PAGE_SIZE = 10;

function frequencyClass(bucket: string): string {
  const text = bucket.toLowerCase();
  if (text.includes("single") || text.includes("ครั้งเดียว") || text.includes("1")) return "badge-freq-single";
  if (text.includes("fast") || text.includes("ถี่")) return "badge-freq-fast";
  if (text.includes("month") || text.includes("เดือน")) return "badge-freq-monthly";
  return "badge-freq-slow";
}

/** Buyer table with search, frequency filter and paging. */
export function CustomerPanel({
  report,
  showCustomers,
  onOpenCustomer,
}: {
  report: SalesReport;
  showCustomers: boolean;
  onOpenCustomer: (customer: SalesCustomer) => void;
}) {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("");
  const [page, setPage] = useState(1);

  const buckets = useMemo(
    () => Array.from(new Set(report.customers.map((c) => c.frequencyBucket).filter(Boolean))),
    [report.customers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return report.customers.filter((c) => {
      if (bucket && c.frequencyBucket !== bucket) return false;
      if (!q) return true;
      return [c.buyer, c.province, c.platform].some((field) => field.toLowerCase().includes(q));
    });
  }, [report.customers, search, bucket]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!showCustomers) {
    return (
      <div className="space-y-6">
          <div className="sd-empty">
            <h2>ต้องมีสิทธิ์ดูลูกค้ารายบุคคล</h2>
            <p>บัญชีนี้ดูได้เฉพาะภาพรวมยอดขาย ไม่สามารถเข้าถึงข้อมูลผู้ซื้อรายคนได้</p>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ลูกค้าในช่วงเวลาที่เลือก</h3>
            <p>
              {formatNumber(filtered.length)} ราย · ยอดซื้อรวม{" "}
              {formatBaht(filtered.reduce((sum, c) => sum + c.sales, 0))}
              {report.masked ? " · แสดงข้อมูลแบบปิดบัง" : ""}
            </p>
          </div>

          <div className="table-controls">
            <input
              className="search-box"
              type="search"
              placeholder="ค้นหาชื่อผู้ซื้อ จังหวัด หรือแพลตฟอร์ม"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="sd-select"
              aria-label="ความถี่การซื้อ"
              value={bucket}
              onChange={(e) => {
                setBucket(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกความถี่</option>
              {buckets.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ผู้ซื้อ</th>
                  <th>แพลตฟอร์ม</th>
                  <th>ออเดอร์</th>
                  <th>ชิ้น</th>
                  <th>ยอดซื้อ</th>
                  <th>เฉลี่ย/ออเดอร์</th>
                  <th>ซื้อครั้งแรก</th>
                  <th>ล่าสุด</th>
                  <th>จังหวัด</th>
                  <th>ความถี่</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((customer, index) => (
                  <tr key={`${customer.platform}-${customer.buyer}`}>
                    <td>{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                    <td>{customer.buyer || "—"}</td>
                    <td>
                      <span className="badge badge-set-tag">{customer.platform}</span>
                    </td>
                    <td>{formatNumber(customer.orders)}</td>
                    <td>{formatNumber(customer.items)}</td>
                    <td className="money-val">{formatBaht(customer.sales)}</td>
                    <td>{formatBaht(customer.aov)}</td>
                    <td>{customer.firstOrder || "-"}</td>
                    <td>{customer.lastOrder || "-"}</td>
                    <td>{customer.province || "-"}</td>
                    <td>
                      <span className={`badge ${frequencyClass(customer.frequencyBucket)}`}>
                        {customer.frequencyBucket || "-"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn-drilldown" onClick={() => onOpenCustomer(customer)}>
                        ดูออเดอร์
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: 28 }}>
                      {report.customers.length === 0 ? "ไม่มีข้อมูลลูกค้าในช่วงนี้" : "ไม่พบลูกค้าที่ตรงกับตัวกรอง"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span>
              ทั้งหมด {formatNumber(filtered.length)} ราย · หน้า {safePage}/{pages}
            </span>
            <div className="pagination-btns">
              <button type="button" className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                ← ก่อนหน้า
              </button>
              <button
                type="button"
                className="page-btn"
                disabled={safePage >= pages}
                onClick={() => setPage(safePage + 1)}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}

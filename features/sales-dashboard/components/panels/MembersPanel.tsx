"use client";

import { formatNumber } from "../../lib/dashboard";
import { useMemberReport } from "../../hooks/useSalesDashboard";
import type { SalesFilters } from "../../types/salesDashboard";

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

/**
 * CRM members tab (plan §6.3 part B): LINE OA members, not marketplace buyers.
 * Codes entered per SKU and member provinces arrive with P2 and the LINE side.
 */
export function MembersPanel({ filters }: { filters: SalesFilters }) {
  const report = useMemberReport(filters);

  if (report.isError) {
    return (
      <div className="container">
        <div className="section-card" style={{ marginTop: 24 }}>
          <p className="sd-error">{(report.error as Error).message}</p>
        </div>
      </div>
    );
  }
  if (!report.data) {
    return (
      <div className="container">
        <div className="sd-loading">กำลังโหลดข้อมูลสมาชิก…</div>
      </div>
    );
  }
  const r = report.data;

  return (
    <section className="tab-panel active">
      <div className="container">
        <div className="kpi-grid" style={{ marginTop: 24 }}>
          <Card title="สมาชิกทั้งหมด" value={formatNumber(r.totalMembers)} sub="ณ ตอนนี้" />
          <Card title="สมาชิกใหม่" value={formatNumber(r.newMembers)} sub={`${r.dateFrom} – ${r.dateTo}`} />
          <Card title="สมาชิกที่ใช้งาน" value={formatNumber(r.activeMembers)} sub="เปิด LINE OA ในช่วงนี้" />
          <Card title="แต้มคงค้าง" value={formatNumber(r.outstandingPoints)} sub="ภาระแต้มที่ยังไม่ถูกใช้" />
          <Card title="แต้มที่ให้" value={formatNumber(r.pointsEarned)} />
          <Card title="แต้มที่แลก" value={formatNumber(r.pointsRedeemed)} />
          <Card title="แต้มหมดอายุ" value={formatNumber(r.pointsExpired)} />
          <Card title="ปรับแต้ม (สุทธิ)" value={formatNumber(r.pointsAdjusted)} sub={`คืนแต้ม ${formatNumber(r.pointsRefunded)}`} />
        </div>

        <div className="section-card" style={{ marginTop: 24 }}>
          <div className="section-title-wrap">
            <h3 className="chart-title">รายเดือน</h3>
            <p>ตัดเดือนตามเวลาไทย</p>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>เดือน</th>
                  <th>สมาชิกใหม่</th>
                  <th>แต้มที่ให้</th>
                  <th>แต้มที่แลก</th>
                  <th>แต้มหมดอายุ</th>
                </tr>
              </thead>
              <tbody>
                {r.months.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td>{formatNumber(m.newMembers)}</td>
                    <td>{formatNumber(m.pointsEarned)}</td>
                    <td>{formatNumber(m.pointsRedeemed)}</td>
                    <td>{formatNumber(m.pointsExpired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card" style={{ marginTop: 24 }}>
          <p className="sd-note">
            SKU ที่สมาชิกกรอกรหัสมากที่สุด และจังหวัดของสมาชิก จะแสดงเมื่อมีระบบล็อตรหัสสินค้า (P2) และฝั่ง LINE OA เก็บที่อยู่สมาชิก
          </p>
        </div>
      </div>
    </section>
  );
}

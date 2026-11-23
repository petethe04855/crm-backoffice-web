"use client";

import { BarList, ColumnChart, CHANNEL_COLORS } from "../Charts";
import { formatBaht, formatNumber, formatPercent } from "../../lib/dashboard";
import type { SalesReport } from "../../types/salesDashboard";

/** Behaviour tab: purchase timing, frequency buckets and repurchase gaps. */
export function BehaviorPanel({ report }: { report: SalesReport }) {
  const weekdayPoints = report.timing.weekdays.map((d) => ({
    label: d.label.slice(0, 2),
    value: d.orders,
    hint: `${d.label} · ${d.orders} ออเดอร์ · ${formatBaht(d.sales)}`,
  }));

  return (
    <div className="space-y-6">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">ลูกค้าซื้อซ้ำ</span>
              <span className="kpi-icon icon-emerald" aria-hidden>
                🔁
              </span>
            </div>
            <div className="kpi-value">{formatNumber(report.repurchase.repeatBuyers)}</div>
            <div className="kpi-sub">{formatPercent(report.repurchase.repeatRatePercent)} ของผู้ซื้อทั้งหมด</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">ระยะห่างเฉลี่ย</span>
              <span className="kpi-icon icon-cyan" aria-hidden>
                ⏳
              </span>
            </div>
            <div className="kpi-value">
              {report.repurchase.averageGapDays > 0 ? `${report.repurchase.averageGapDays.toFixed(1)} วัน` : "—"}
            </div>
            <div className="kpi-sub">ระหว่างการซื้อสองครั้งติดกัน</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">ชั่วโมงขายดี</span>
              <span className="kpi-icon icon-gold" aria-hidden>
                ⏰
              </span>
            </div>
            <div className="kpi-value">
              {report.timing.peakHour >= 0 ? `${String(report.timing.peakHour).padStart(2, "0")}:00` : "—"}
            </div>
            <div className="kpi-sub">{report.timing.peakWeekday || "ยังไม่มีข้อมูล"}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">วันขายดีของเดือน</span>
              <span className="kpi-icon icon-purple" aria-hidden>
                📅
              </span>
            </div>
            <div className="kpi-value">{report.timing.peakDay > 0 ? `วันที่ ${report.timing.peakDay}` : "—"}</div>
            <div className="kpi-sub">นับจากวันที่ในคำสั่งซื้อ</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">ออเดอร์รายชั่วโมง</h3>
                <p className="chart-desc">เวลาไทย (Asia/Bangkok)</p>
              </div>
            </div>
            <div className="chart-container" style={{ height: 240 }}>
              <ColumnChart
                color={CHANNEL_COLORS.gold}
                labelEvery={3}
                points={report.timing.hours.map((h) => ({
                  label: String(h.hour),
                  value: h.orders,
                  hint: `${String(h.hour).padStart(2, "0")}:00 · ${h.orders} ออเดอร์`,
                }))}
              />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">ออเดอร์รายวัน</h3>
                <p className="chart-desc">วันในสัปดาห์</p>
              </div>
            </div>
            <div className="chart-container" style={{ height: 240 }}>
              <ColumnChart color={CHANNEL_COLORS.emerald} points={weekdayPoints} />
            </div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">ระยะเวลาซื้อซ้ำ</h3>
                <p className="chart-desc">จำนวนวันที่เว้นระหว่างออเดอร์</p>
              </div>
            </div>
            <BarList
              empty="ยังไม่มีลูกค้าที่ซื้อซ้ำ"
              items={report.repurchase.buckets.map((b) => ({
                label: b.label,
                value: b.buyers,
                share: b.sharePercent,
                meta: `${formatNumber(b.buyers)} คน · ${formatPercent(b.sharePercent)}`,
                color: CHANNEL_COLORS.emerald,
              }))}
            />
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">ความถี่การซื้อ</h3>
                <p className="chart-desc">แบ่งกลุ่มตามจำนวนออเดอร์ในช่วงที่เลือก</p>
              </div>
            </div>
            <BarList
              empty="ไม่มีข้อมูลความถี่ (ต้องมีสิทธิ์ดูลูกค้ารายคน)"
              items={report.frequencies.map((f) => ({
                label: f.label,
                value: f.buyers,
                share: f.sharePercent,
                meta: `${formatNumber(f.buyers)} คน · ${formatPercent(f.sharePercent)}`,
                color: CHANNEL_COLORS.blue,
              }))}
            />
          </div>
        </div>

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ออเดอร์ตามวันของเดือน</h3>
            <p>ช่วยวางแผนแคมเปญต้นเดือน กลางเดือน และปลายเดือน</p>
          </div>
          <div className="chart-container" style={{ height: 220 }}>
            <ColumnChart
              color={CHANNEL_COLORS.rose}
              labelEvery={5}
              points={report.timing.daysOfMonth.map((d) => ({
                label: String(d.day),
                value: d.orders,
                hint: `วันที่ ${d.day} · ${d.orders} ออเดอร์ · ${formatBaht(d.sales)}`,
              }))}
            />
          </div>
        </div>
    </div>
  );
}

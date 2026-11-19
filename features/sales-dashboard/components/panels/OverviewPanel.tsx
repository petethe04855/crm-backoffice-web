"use client";

import { useState } from "react";
import { BarList, ColumnChart, StackedBarChart, CHANNEL_COLORS } from "../Charts";
import {
  changeClass,
  changeLabel,
  formatBaht,
  formatNumber,
  formatPercent,
  shortPeriod,
} from "../../lib/dashboard";
import type { SalesCustomer, SalesReport } from "../../types/salesDashboard";

function Kpi({
  title,
  icon,
  tone,
  value,
  change,
  sub,
  gold,
}: {
  title: string;
  icon: string;
  tone: string;
  value: string;
  change: number | null;
  sub: string;
  gold?: boolean;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <span className={`kpi-icon ${tone}`} aria-hidden>
          {icon}
        </span>
      </div>
      <div className={`kpi-value${gold ? " gold" : ""}`}>{value}</div>
      <div className={`product-change ${changeClass(change)}`}>{changeLabel(change)}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

/** Overview tab: KPIs, trend, channel mix, champion spotlight and takeaways. */
export function OverviewPanel({
  report,
  onOpenCustomer,
}: {
  report: SalesReport;
  onOpenCustomer: (customer: SalesCustomer) => void;
}) {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const points = mode === "weekly" ? report.trend.weekly : report.trend.monthly;
  const champion = report.customers[0];
  const bestProvince = report.provinces[0];
  const bestFlavor = report.flavors[0];
  const topProducts = report.products.slice(0, 4);

  return (
    <section className="tab-panel active">
      <div className="container">
        <div className="kpi-grid" style={{ marginTop: 24 }}>
          <Kpi
            title="ยอดขายรวม"
            icon="💰"
            tone="icon-gold"
            gold
            value={formatBaht(report.summary.sales)}
            change={report.summary.salesChangePercent}
            sub={`ช่วงก่อน ${formatBaht(report.previous.sales)}`}
          />
          <Kpi
            title="จำนวนออเดอร์"
            icon="🧾"
            tone="icon-blue"
            value={formatNumber(report.summary.orders)}
            change={report.summary.ordersChangePercent}
            sub={`ช่วงก่อน ${formatNumber(report.previous.orders)}`}
          />
          <Kpi
            title="ผู้ซื้อ"
            icon="👥"
            tone="icon-emerald"
            value={formatNumber(report.summary.buyers)}
            change={report.summary.buyersChangePercent}
            sub={`ช่วงก่อน ${formatNumber(report.previous.buyers)}`}
          />
          <Kpi
            title="ชิ้นที่ขายได้"
            icon="📦"
            tone="icon-purple"
            value={formatNumber(report.summary.items)}
            change={null}
            sub="รวมทุกช่องทาง"
          />
          <Kpi
            title="ยอดเฉลี่ยต่อออเดอร์"
            icon="🛒"
            tone="icon-cyan"
            value={formatBaht(report.summary.aov)}
            change={report.summary.aovChangePercent}
            sub={`ช่วงก่อน ${formatBaht(report.previous.aov)}`}
          />
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">แนวโน้มยอดขาย</h3>
                <p className="chart-desc">แยกช่องทาง Shopee และ TikTok</p>
              </div>
              <div className="filter-btn-group">
                <button
                  type="button"
                  className={`filter-btn${mode === "weekly" ? " active" : ""}`}
                  onClick={() => setMode("weekly")}
                >
                  รายสัปดาห์
                </button>
                <button
                  type="button"
                  className={`filter-btn${mode === "monthly" ? " active" : ""}`}
                  onClick={() => setMode("monthly")}
                >
                  รายเดือน
                </button>
              </div>
            </div>
            <div className="chart-container">
              <StackedBarChart
                points={points.map((p) => ({
                  label: shortPeriod(p.period),
                  primary: p.shopeeSales,
                  secondary: p.tiktokSales,
                  total: p.totalSales,
                  hint: `${p.startDate} – ${p.endDate}: ${formatBaht(p.totalSales)} (${p.totalOrders} ออเดอร์)`,
                }))}
                primaryLabel="Shopee"
                secondaryLabel="TikTok"
              />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">สัดส่วนช่องทาง</h3>
                <p className="chart-desc">ยอดขายและจำนวนออเดอร์ต่อช่องทาง</p>
              </div>
            </div>
            <BarList
              empty="ไม่มีออเดอร์ในช่วงนี้"
              items={report.channels.map((c) => ({
                label: c.label || c.channel,
                value: c.sales,
                share: c.sharePercent,
                meta: `${formatBaht(c.sales)} · ${formatNumber(c.orders)} ออเดอร์`,
                color: c.channel.toLowerCase().includes("tiktok") ? CHANNEL_COLORS.tiktok : CHANNEL_COLORS.shopee,
              }))}
            />
            <div className="highlight-card-grid" style={{ marginTop: 18 }}>
              <div className="highlight-card">
                <div className="highlight-card-title">🧮 ยอดเฉลี่ยต่อผู้ซื้อ</div>
                <div className="highlight-card-body">
                  {report.summary.buyers > 0
                    ? formatBaht(report.summary.sales / report.summary.buyers)
                    : formatBaht(0)}{" "}
                  ต่อคน จาก {formatNumber(report.summary.buyers)} ผู้ซื้อ
                </div>
              </div>
              <div className="highlight-card">
                <div className="highlight-card-title">🔁 อัตราซื้อซ้ำ</div>
                <div className="highlight-card-body">
                  {formatPercent(report.repurchase.repeatRatePercent)} · {formatNumber(report.repurchase.repeatBuyers)} คน
                  {report.repurchase.averageGapDays > 0
                    ? ` · เว้นช่วงเฉลี่ย ${report.repurchase.averageGapDays.toFixed(1)} วัน`
                    : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {champion && (
          <div className="spotlight-card">
            <div className="spotlight-inner">
              <div>
                <span className="champion-badge">🏆 ลูกค้าอันดับ 1</span>
                <div className="champion-username">
                  <span>{champion.buyer}</span>
                  <span className="badge badge-set-tag">{champion.platform}</span>
                </div>
                <p className="champion-sub">
                  {champion.province || "ไม่ระบุจังหวัด"} · {formatPercent(champion.orders > 0 ? (champion.sales / report.summary.sales) * 100 : 0)} ของยอดรวม
                </p>
                <div className="champion-metrics">
                  <div className="champ-stat">
                    <div className="champ-stat-label">ยอดซื้อ</div>
                    <div className="champ-stat-value">{formatBaht(champion.sales)}</div>
                  </div>
                  <div className="champ-stat">
                    <div className="champ-stat-label">ออเดอร์</div>
                    <div className="champ-stat-value">{formatNumber(champion.orders)}</div>
                  </div>
                  <div className="champ-stat">
                    <div className="champ-stat-label">เฉลี่ย/ออเดอร์</div>
                    <div className="champ-stat-value">{formatBaht(champion.aov)}</div>
                  </div>
                  <div className="champ-stat">
                    <div className="champ-stat-label">ชิ้นสินค้า</div>
                    <div className="champ-stat-value">{formatNumber(champion.items)}</div>
                  </div>
                </div>
                <div className="champ-detail-list">
                  <span>ซื้อครั้งแรก: {champion.firstOrder || "-"}</span>
                  <span>ล่าสุด: {champion.lastOrder || "-"}</span>
                  <span>ความถี่: {champion.frequencyBucket || "-"}</span>
                </div>
                <button type="button" className="btn-drilldown" style={{ marginTop: 14 }} onClick={() => onOpenCustomer(champion)}>
                  ดูรายละเอียดลูกค้า →
                </button>
              </div>
              <div className="fav-products-box">
                <div className="box-title">🔥 สินค้าขายดี</div>
                {topProducts.length === 0 && <p className="sd-note">ยังไม่มีข้อมูลสินค้า</p>}
                {topProducts.map((product) => (
                  <div className="fav-item" key={`${product.sku}-${product.name}`}>
                    <span className="fav-item-name">{product.name || product.sku || "ไม่ระบุชื่อ"}</span>
                    <span className="fav-item-qty">{formatNumber(product.units)} ชิ้น</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ข้อสรุปที่น่าสนใจ</h3>
            <p>สรุปจากตัวเลขของช่วงที่เลือก</p>
          </div>
          <div className="highlight-card-grid">
            <div className="highlight-card">
              <div className="highlight-card-title">📍 จังหวัดขายดี</div>
              <div className="highlight-card-body">
                {bestProvince
                  ? `${bestProvince.province} · ${formatBaht(bestProvince.sales)} (${formatPercent(bestProvince.sharePercent)})`
                  : "ยังไม่มีข้อมูลจังหวัด"}
              </div>
            </div>
            <div className="highlight-card">
              <div className="highlight-card-title">🍗 รสชาติขายดี</div>
              <div className="highlight-card-body">
                {bestFlavor
                  ? `${bestFlavor.label} · ${formatNumber(bestFlavor.units)} ชิ้น (${formatPercent(bestFlavor.sharePercent)})`
                  : "ยังไม่มีข้อมูลรสชาติ"}
              </div>
            </div>
            <div className="highlight-card">
              <div className="highlight-card-title">⏰ ช่วงเวลาขายดี</div>
              <div className="highlight-card-body">
                {report.timing.peakHour >= 0
                  ? `${String(report.timing.peakHour).padStart(2, "0")}:00 น. · ${report.timing.peakWeekday || "-"}`
                  : "ยังไม่มีข้อมูลเวลา"}
              </div>
            </div>
            <div className="highlight-card">
              <div className="highlight-card-title">📅 วันที่ขายดี</div>
              <div className="highlight-card-body">
                {report.timing.peakDay > 0 ? `วันที่ ${report.timing.peakDay} ของเดือน` : "ยังไม่มีข้อมูล"}
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">ออเดอร์ตามช่วงเวลา</h3>
            <p>จำนวนออเดอร์ในแต่ละชั่วโมงของวัน</p>
          </div>
          <div className="chart-container" style={{ height: 220 }}>
            <ColumnChart
              color={CHANNEL_COLORS.purple}
              labelEvery={3}
              points={report.timing.hours.map((h) => ({
                label: `${h.hour}`,
                value: h.orders,
                hint: `${String(h.hour).padStart(2, "0")}:00 · ${h.orders} ออเดอร์ · ${formatBaht(h.sales)}`,
              }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

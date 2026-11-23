"use client";

import { useMemo, useState } from "react";
import { changeClass, changeLabel, formatBaht, formatNumber, formatPercent, shortPeriod } from "../../lib/dashboard";
import type { SalesFlavor, SalesReport } from "../../types/salesDashboard";

const FLAVOR_COLORS: Record<string, string> = {
  chicken: "#f59e0b",
  tuna: "#00B5D8",
  rabbit: "#ec4899",
};

const FLAVOR_CLASS: Record<string, string> = {
  chicken: "flavor-chicken",
  tuna: "flavor-tuna",
  rabbit: "flavor-rabbit",
};

function flavorClass(key: string): string {
  return FLAVOR_CLASS[key] ?? "flavor-total";
}

function monthsOf(flavors: SalesFlavor[]): string[] {
  const months = new Set<string>();
  flavors.forEach((flavor) => flavor.months.forEach((month) => months.add(month.month)));
  return Array.from(months).sort();
}

/** Product tab: flavor mix, monthly breakdown and the SKU ranking. */
export function FlavorPanel({ report }: { report: SalesReport }) {
  const months = useMemo(() => monthsOf(report.flavors), [report.flavors]);
  const [view, setView] = useState<"share" | "units">("share");
  const totalUnits = report.flavors.reduce((sum, f) => sum + f.units, 0);
  const topFlavor = report.flavors[0];

  return (
    <div className="space-y-6">
        <div className="product-mix-shell">
          <div className="product-mix-toolbar">
            <div>
              <div className="product-mix-eyebrow">Product mix decision view</div>
              <h3 className="product-mix-title">สัดส่วนรสชาติที่ขายได้</h3>
              <p className="product-mix-description">
                รวม {formatNumber(totalUnits)} ชิ้น จาก {formatNumber(report.summary.orders)} ออเดอร์
              </p>
            </div>
            <div className="product-view-switch" role="group" aria-label="มุมมอง">
              <button
                type="button"
                className={`product-view-btn${view === "share" ? " active" : ""}`}
                onClick={() => setView("share")}
              >
                สัดส่วน
              </button>
              <button
                type="button"
                className={`product-view-btn${view === "units" ? " active" : ""}`}
                onClick={() => setView("units")}
              >
                จำนวนชิ้น
              </button>
            </div>
          </div>

          <div className="product-insight-grid">
            <div className="product-insight">
              <div className="product-insight-label">รสชาติที่ขายดี</div>
              <div className="product-insight-value">
                {topFlavor ? `${topFlavor.label} · ${formatPercent(topFlavor.sharePercent)}` : "—"}
              </div>
            </div>
            <div className="product-insight">
              <div className="product-insight-label">สินค้าขายดี</div>
              <div className="product-insight-value">
                {report.products[0]?.name || report.products[0]?.sku || "—"}
              </div>
            </div>
            <div className="product-insight">
              <div className="product-insight-label">เซ็ตที่ถูกสั่งมากที่สุด</div>
              <div className="product-insight-value">{report.sets[0]?.name || "—"}</div>
            </div>
          </div>

          <div className="product-mix-list">
            {report.flavors.length === 0 && (
              <div className="product-empty">ยังไม่มีข้อมูลรสชาติ (ERP ยังไม่ส่งข้อมูลการแมปรสชาติ)</div>
            )}
            {report.flavors.map((flavor, index) => {
              const primary = view === "share" ? flavor.sharePercent : flavor.units;
              const width = view === "share" ? flavor.sharePercent : totalUnits > 0 ? (flavor.units / totalUnits) * 100 : 0;
              return (
                <div key={flavor.key} className={`product-mix-row${index === 0 ? " is-leader" : ""}`}>
                  <div
                    className="product-mix-fill"
                    style={{ width: `${width}%`, background: FLAVOR_COLORS[flavor.key] ?? "#8b5cf6" }}
                  />
                  <div className="product-mix-content">
                    <span className="product-rank">{index + 1}</span>
                    <div>
                      <div className="product-name">
                        <span className={`flavor-pill ${flavorClass(flavor.key)}`}>{flavor.label}</span>
                      </div>
                      <div className="product-sub">
                        {formatNumber(flavor.units)} ชิ้น · {formatNumber(flavor.orders)} ออเดอร์ · {formatBaht(flavor.sales)}
                      </div>
                    </div>
                    <div className="product-share">
                      {view === "share" ? formatPercent(primary) : formatNumber(primary)}
                    </div>
                    <div className={`product-change ${changeClass(flavor.changePercent)}`}>
                      {changeLabel(flavor.changePercent)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="product-monthly-shell">
          <div className="product-monthly-header">
            <div>
              <div className="product-monthly-title">ยอดขายรายเดือนตามรสชาติ</div>
              <div className="product-monthly-description">จำนวนชิ้นที่ขายได้ในแต่ละเดือนของช่วงข้อมูล</div>
            </div>
            <span className="product-monthly-meta">{months.length} เดือน</span>
          </div>
          <div className="product-monthly-scroll">
            <table className="product-monthly-table">
              <thead>
                <tr>
                  <th>รสชาติ</th>
                  {months.map((month) => (
                    <th key={month}>{shortPeriod(month)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.flavors.map((flavor) => (
                  <tr key={flavor.key}>
                    <td>
                      <span className={`flavor-pill ${flavorClass(flavor.key)}`}>{flavor.label}</span>
                    </td>
                    {months.map((month) => {
                      const row = flavor.months.find((m) => m.month === month);
                      return (
                        <td key={month}>
                          {row && row.units > 0 ? (
                            <>
                              <span className="monthly-units">{formatNumber(row.units)}</span>
                              <span className="monthly-share">{formatPercent(row.sharePercent)}</span>
                            </>
                          ) : (
                            <span className="monthly-zero">–</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>รวม</td>
                  {months.map((month) => {
                    const units = report.flavors.reduce(
                      (sum, flavor) => sum + (flavor.months.find((m) => m.month === month)?.units ?? 0),
                      0,
                    );
                    return (
                      <td key={month}>
                        <span className="monthly-units">{formatNumber(units)}</span>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="section-card">
          <div className="section-title-wrap">
            <h3 className="chart-title">สินค้าขายดี</h3>
            <p>เรียงตามจำนวนชิ้นที่ขายได้ในช่วงที่เลือก</p>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>สินค้า</th>
                  <th>ชิ้น</th>
                  <th>ออเดอร์</th>
                  <th>ยอดขาย</th>
                  <th>สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((product, index) => (
                  <tr key={`${product.sku}-${product.name}`}>
                    <td>{index + 1}</td>
                    <td>{product.sku || "-"}</td>
                    <td>{product.name || "-"}</td>
                    <td>{formatNumber(product.units)}</td>
                    <td>{formatNumber(product.orders)}</td>
                    <td className="money-val">{formatBaht(product.sales)}</td>
                    <td>{formatPercent(product.sharePercent)}</td>
                  </tr>
                ))}
                {report.products.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 26 }}>
                      ยังไม่มีข้อมูลสินค้าในช่วงนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <details className="deep-dive">
          <summary>เซ็ตและของแถม</summary>
          <div className="charts-row" style={{ marginTop: 14 }}>
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">เซ็ตที่ขายได้</h3>
                  <p className="chart-desc">จำนวนออเดอร์ต่อเซ็ต</p>
                </div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>เซ็ต</th>
                      <th>ออเดอร์</th>
                      <th>สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sets.map((set) => (
                      <tr key={set.name}>
                        <td>
                          <span className="badge-set-tag">{set.name}</span>
                        </td>
                        <td>{formatNumber(set.orders)}</td>
                        <td>{formatPercent(set.sharePercent)}</td>
                      </tr>
                    ))}
                    {report.sets.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                          ไม่พบเซ็ตในช่วงนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">ของแถม</h3>
                  <p className="chart-desc">จำนวนชิ้นต่อของแถม</p>
                </div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ของแถม</th>
                      <th>ชิ้น</th>
                      <th>สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.accessories.map((accessory) => (
                      <tr key={accessory.key}>
                        <td>{accessory.label}</td>
                        <td>{formatNumber(accessory.units)}</td>
                        <td>{formatPercent(accessory.sharePercent)}</td>
                      </tr>
                    ))}
                    {report.accessories.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                          ไม่พบของแถมในช่วงนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </details>
    </div>
  );
}

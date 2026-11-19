"use client";

import { useCustomerDetail } from "../hooks/useSalesDashboard";
import { formatBaht, formatNumber } from "../lib/dashboard";
import type { SalesCustomer, SalesFilters } from "../types/salesDashboard";

/** Drill-down modal of one buyer. Only rendered for staff with buyer permission. */
export function CustomerModal({
  customer,
  filters,
  onClose,
}: {
  customer: SalesCustomer | null;
  filters: SalesFilters;
  onClose: () => void;
}) {
  const detail = useCustomerDetail(customer?.platform ?? "", customer?.buyer ?? "", filters);

  return (
    <div
      className={`modal-overlay${customer ? " active" : ""}`}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {customer && (
        <div className="modal-content" role="dialog" aria-modal="true" aria-label={`ออเดอร์ของ ${customer.buyer}`}>
          <div className="modal-header">
            <div>
              <div className="champion-username" style={{ fontSize: "1.2rem", marginBottom: 2 }}>
                {customer.buyer}
              </div>
              <p className="champion-sub" style={{ marginBottom: 0 }}>
                {customer.platform} · {customer.province || "ไม่ระบุจังหวัด"} · {customer.frequencyBucket || "-"}
              </p>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="ปิด">
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-flavor-strip">
              <div className="modal-flavor-card flavor-c">
                <span>ยอดซื้อ</span>
                <strong>{formatBaht(customer.sales)}</strong>
              </div>
              <div className="modal-flavor-card flavor-t">
                <span>ออเดอร์</span>
                <strong>{formatNumber(customer.orders)}</strong>
              </div>
              <div className="modal-flavor-card flavor-r">
                <span>เฉลี่ย/ออเดอร์</span>
                <strong>{formatBaht(customer.aov)}</strong>
              </div>
              <div className="modal-flavor-card flavor-all">
                <span>ชิ้นสินค้า</span>
                <strong>{formatNumber(customer.items)}</strong>
              </div>
            </div>

            <p className="sd-note" style={{ marginTop: 0, marginBottom: 12 }}>
              ซื้อครั้งแรก {customer.firstOrder || "-"} · ล่าสุด {customer.lastOrder || "-"}
            </p>

            {detail.isError && <p className="sd-error">{(detail.error as Error).message}</p>}
            {detail.isPending && <p className="sd-note">กำลังโหลดออเดอร์…</p>}

            {detail.data && (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ออเดอร์</th>
                      <th>วันที่</th>
                      <th>ช่องทาง</th>
                      <th>จังหวัด</th>
                      <th>ชิ้น</th>
                      <th>ยอด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.data.orders.map((order) => (
                      <tr key={`${order.platform}-${order.orderNo}`}>
                        <td>{order.orderNo}</td>
                        <td>{order.date}</td>
                        <td>{order.channel || order.platform}</td>
                        <td>{order.province || "-"}</td>
                        <td>{formatNumber(order.items)}</td>
                        <td className="money-val">{formatBaht(order.amount)}</td>
                      </tr>
                    ))}
                    {detail.data.orders.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 24 }}>
                          ไม่พบออเดอร์ในช่วงเวลานี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="sd-modal-footer">
            <button type="button" className="sd-btn-ghost" onClick={onClose}>
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

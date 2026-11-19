"use client";

/** Chart primitives built from divs and inline sizes: the project has no chart library. */

export const CHANNEL_COLORS = {
  shopee: "#FF6B00",
  tiktok: "#fe2c55",
  gold: "#f59e0b",
  cyan: "#00B5D8",
  purple: "#8b5cf6",
  emerald: "#10b981",
  rose: "#f43f5e",
  blue: "#3b82f6",
} as const;

function ratio(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, part / total));
}

export interface StackedPoint {
  label: string;
  primary: number;
  secondary: number;
  total: number;
  hint?: string;
}

/**
 * Vertical stacked bars (Shopee + TikTok). A zero period still renders a
 * baseline slot so the axis keeps all weeks/months.
 */
export function StackedBarChart({
  points,
  primaryLabel,
  secondaryLabel,
  primaryColor = CHANNEL_COLORS.shopee,
  secondaryColor = CHANNEL_COLORS.tiktok,
}: {
  points: StackedPoint[];
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  if (points.length === 0) {
    return <p className="sd-note">ไม่มีข้อมูลในช่วงเวลานี้</p>;
  }
  const max = Math.max(1, ...points.map((p) => p.total));
  return (
    <div className="sd-chart">
      <div className="sd-chart-legend">
        <span>
          <i style={{ background: primaryColor }} /> {primaryLabel}
        </span>
        <span>
          <i style={{ background: secondaryColor }} /> {secondaryLabel}
        </span>
      </div>
      <div className="sd-chart-bars">
        {points.map((p) => (
          <div className="sd-chart-col" key={p.label}>
            <div className="sd-chart-slot">
              <div
                className="sd-chart-stack"
                style={{ height: `${Math.max(p.total > 0 ? 2 : 0, ratio(p.total, max) * 100)}%` }}
                title={p.hint}
              >
                <div style={{ height: `${ratio(p.secondary, p.total) * 100}%`, background: secondaryColor }} />
                <div style={{ height: `${ratio(p.primary, p.total) * 100}%`, background: primaryColor }} />
              </div>
            </div>
            <span className="sd-chart-label">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface BarItem {
  label: string;
  share?: number;
  meta?: string;
  color?: string;
}

/** Horizontal share bars: channel mix, frequency buckets, repurchase gaps. */
export function BarList({ items, empty }: { items: BarItem[]; empty: string }) {
  if (items.length === 0) return <p className="sd-note">{empty}</p>;
  return (
    <div className="sd-barlist">
      {items.map((item) => {
        const share = item.share ?? 0;
        return (
          <div className="sd-barlist-row" key={item.label}>
            <div className="sd-barlist-head">
              <span className="sd-barlist-label">{item.label}</span>
              <span className="sd-barlist-value">
                {item.meta ?? `${share.toFixed(1)}%`}
              </span>
            </div>
            <div className="sd-barlist-track">
              <div
                className="sd-barlist-fill"
                style={{ width: `${Math.max(share > 0 ? 1.5 : 0, share)}%`, background: item.color ?? CHANNEL_COLORS.gold }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface ColumnPoint {
  label: string;
  value: number;
  hint?: string;
}

/** Single-series column chart for the timing distributions. */
export function ColumnChart({
  points,
  color = CHANNEL_COLORS.cyan,
  labelEvery = 1,
}: {
  points: ColumnPoint[];
  color?: string;
  labelEvery?: number;
}) {
  if (points.length === 0) return <p className="sd-note">ไม่มีข้อมูลในช่วงเวลานี้</p>;
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="sd-columns">
      {points.map((p, index) => (
        <div className="sd-column" key={p.label}>
          <div className="sd-column-slot">
            <div
              className="sd-column-bar"
              style={{ height: `${Math.max(p.value > 0 ? 2 : 0, ratio(p.value, max) * 100)}%`, background: color }}
              title={p.hint}
            />
          </div>
          <span className="sd-column-label">{index % labelEvery === 0 ? p.label : ""}</span>
        </div>
      ))}
    </div>
  );
}

/** Funnel-ish list with an inline share bar, used by the geographic roll-up. */
export function MetricBar({
  label,
  value,
  share,
  color = CHANNEL_COLORS.cyan,
}: {
  label: string;
  value: string;
  share?: number;
  color?: string;
}) {
  return (
    <div className="sd-metric-bar">
      <span className="sd-metric-bar-label">{label}</span>
      <div className="sd-barlist-track">
        <div
          className="sd-barlist-fill"
          style={{ width: `${Math.max(share ?? 0, 0)}%`, background: color }}
        />
      </div>
      <span className="sd-metric-bar-value">{value}</span>
    </div>
  );
}

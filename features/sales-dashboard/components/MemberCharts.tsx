"use client";

import { useState, type ReactNode } from "react";
import { formatNumber } from "../lib/dashboard";

/**
 * Charts for the members tab. Plain divs (the project has no chart library).
 * Colours: validated categorical slots (blue, orange, aqua, yellow) on the
 * white surface; orange/aqua/yellow sit under 3:1, so every part also carries
 * a visible label and a legend (identity is never colour alone). One hue is
 * used for magnitude charts. Values are text tokens, never the series colour.
 */
export const MEMBER_SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"] as const;
/** Magnitude (age, rewards, months): one hue. */
export const MEMBER_MAGNITUDE = "#2a78d6";
/** "Not given" (no gender / no birth date): neutral, not a series hue. */
export const MEMBER_UNKNOWN = "#a1a1aa";

interface Tip {
  x: number;
  y: number;
  title: string;
  value: string;
}

/** One floating readout per chart; hover and keyboard focus both open it. */
function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const bind = (title: string, value: string) => ({
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const box = (e.currentTarget.closest(".mc-chart") as HTMLElement).getBoundingClientRect();
      setTip({ x: e.clientX - box.left, y: e.clientY - box.top, title, value });
    },
    onPointerLeave: () => setTip(null),
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      const box = (e.currentTarget.closest(".mc-chart") as HTMLElement).getBoundingClientRect();
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ x: r.left - box.left + r.width / 2, y: r.top - box.top, title, value });
    },
    onBlur: () => setTip(null),
    tabIndex: 0,
    "aria-label": `${title}: ${value}`,
  });
  const node: ReactNode = tip ? (
    <div className="mc-tip" style={{ left: tip.x, top: tip.y }} role="status">
      <strong>{tip.value}</strong>
      <span>{tip.title}</span>
    </div>
  ) : null;
  return { bind, node };
}

export interface Part {
  key: string;
  label: string;
  value: number;
  share: number; // percent, from the API
  unknown?: boolean;
}

/** One whole split into parts (gender): tall segmented bar + legend. */
export function SegmentedBar({ parts, unit }: { parts: Part[]; unit: string }) {
  const { bind, node } = useTip();
  const total = parts.reduce((s, p) => s + p.value, 0);
  let slot = 0;
  const colored = parts.map((p) => ({ ...p, color: p.unknown ? MEMBER_UNKNOWN : MEMBER_SERIES[slot++ % MEMBER_SERIES.length] }));
  return (
    <div className="mc-chart">
      <div className="mc-seg" role="img" aria-label={colored.map((p) => `${p.label} ${p.share.toFixed(1)}%`).join(", ")}>
        {colored
          .filter((p) => p.value > 0)
          .map((p) => (
            <div
              key={p.key}
              className="mc-seg-part"
              style={{ flexGrow: total > 0 ? p.value / total : 0, background: p.color }}
              {...bind(p.label, `${formatNumber(p.value)} ${unit} · ${p.share.toFixed(1)}%`)}
            >
              {p.share >= 12 && <span className="mc-seg-label">{Math.round(p.share)}%</span>}
            </div>
          ))}
      </div>
      <ul className="mc-legend">
        {colored.map((p) => (
          <li key={p.key}>
            <span className="mc-swatch" style={{ background: p.color }} aria-hidden />
            <span className="mc-legend-name">{p.label}</span>
            <span className="mc-legend-value">
              {formatNumber(p.value)} {unit} · {p.share.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
      {node}
    </div>
  );
}

export interface Column {
  key: string;
  label: string;
  value: number;
  hint: string;
  unknown?: boolean;
}

/** Ordered columns on one baseline (age bands, months). */
export function Columns({ columns, height = 180 }: { columns: Column[]; height?: number }) {
  const { bind, node } = useTip();
  const max = Math.max(1, ...columns.map((c) => c.value));
  return (
    <div className="mc-chart">
      <div className="mc-cols" style={{ height }}>
        {columns.map((c) => (
          <div className="mc-col" key={c.key}>
            <span className="mc-col-value">{c.value > 0 ? formatNumber(c.value) : ""}</span>
            <div className="mc-col-slot">
              <div
                className="mc-col-bar"
                style={{
                  height: `${c.value > 0 ? Math.max(2, (c.value / max) * 100) : 0}%`,
                  background: c.unknown ? MEMBER_UNKNOWN : MEMBER_MAGNITUDE,
                }}
                {...bind(c.label, c.hint)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mc-axis">
        {columns.map((c) => (
          <span key={c.key} className="mc-axis-label">
            {c.label}
          </span>
        ))}
      </div>
      {node}
    </div>
  );
}

export interface RankedBar {
  key: string;
  label: string;
  value: number;
  valueText: string;
  hint: string;
}

/** Ranked horizontal bars (rewards redeemed), largest first, one hue. */
export function RankedBars({ bars }: { bars: RankedBar[] }) {
  const { bind, node } = useTip();
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="mc-chart mc-ranked">
      {bars.map((b) => (
        <div className="mc-rank-row" key={b.key}>
          <span className="mc-rank-name" title={b.label}>
            {b.label}
          </span>
          <div className="mc-rank-track">
            <div
              className="mc-rank-bar"
              style={{ width: `${Math.max(1, (b.value / max) * 100)}%`, background: MEMBER_MAGNITUDE }}
              {...bind(b.label, b.hint)}
            />
          </div>
          <span className="mc-rank-value">{b.valueText}</span>
        </div>
      ))}
      {node}
    </div>
  );
}

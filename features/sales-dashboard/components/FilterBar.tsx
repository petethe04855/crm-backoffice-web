"use client";

import { CHANNEL_OPTIONS, PRESETS, REGION_OPTIONS, matchPreset, isRangeValid, type DateRange, type PresetKey, formatBaht, daysInclusive } from "../lib/dashboard";
import type { SalesFilters, SalesSummary } from "../types/salesDashboard";

/** Command bar: presets, a custom range, channel pills and the region select. */
export function FilterBar({
  filters,
  draft,
  summary,
  fetching,
  onDraftChange,
  onApply,
  onPreset,
  onChannel,
  onRegion,
  onReset,
}: {
  filters: SalesFilters;
  draft: DateRange;
  summary?: SalesSummary;
  fetching?: boolean;
  onDraftChange: (range: DateRange) => void;
  onApply: () => void;
  onPreset: (key: PresetKey) => void;
  onChannel: (value: string) => void;
  onRegion: (value: string) => void;
  onReset: () => void;
}) {
  const activePreset = matchPreset({ from: filters.dateFrom, to: filters.dateTo });
  const valid = isRangeValid(draft.from, draft.to);
  const days = daysInclusive(filters.dateFrom, filters.dateTo);

  return (
    <div className="filter-sticky-bar">
      <div className="container">
        <div className="filter-bar-inner">
          <div className="filter-left-controls">
            <div className="date-custom-controls">
              <span className="date-input-chip">
                <label htmlFor="sd-from">ตั้งแต่</label>
                <input
                  id="sd-from"
                  type="date"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => onDraftChange({ ...draft, from: e.target.value })}
                />
              </span>
              <span className="date-separator">→</span>
              <span className="date-input-chip">
                <label htmlFor="sd-to">ถึง</label>
                <input
                  id="sd-to"
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => onDraftChange({ ...draft, to: e.target.value })}
                />
              </span>
              <button type="button" className="sd-btn-primary" onClick={onApply} disabled={!valid || fetching}>
                ใช้ช่วงนี้
              </button>
              {!valid && <span className="sd-error">ช่วงวันที่ต้องเรียงถูกและไม่เกิน 366 วัน</span>}
            </div>

            <div className="quick-preset-chips">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.key}
                  className={`preset-chip${activePreset === preset.key ? " active" : ""}`}
                  onClick={() => onPreset(preset.key)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="platform-segment">
              {CHANNEL_OPTIONS.map((option) => {
                const tabClass =
                  option.value === "shopee" ? " tab-shopee" : option.value === "tiktok" ? " tab-tiktok" : "";
                return (
                  <button
                    type="button"
                    key={option.value}
                    className={`platform-pill${tabClass}${filters.channel === option.value ? " active" : ""}`}
                    onClick={() => onChannel(option.value)}
                  >
                    <span aria-hidden>{option.icon}</span> {option.label}
                  </button>
                );
              })}
            </div>

            <select
              className="sd-select"
              aria-label="ภูมิภาค"
              value={filters.region}
              onChange={(e) => onRegion(e.target.value)}
            >
              <option value="">ทุกภูมิภาค</option>
              {REGION_OPTIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <button type="button" className="btn-reset-filter" onClick={onReset} title="ล้างตัวกรอง">
              ↺ ล้างตัวกรอง
            </button>
          </div>

          <div className="filter-live-stat">
            <span>
              {days} วัน · {filters.dateFrom} → {filters.dateTo}
            </span>
            {summary && (
              <span>
                ยอดรวม <span className="stat-highlight">{formatBaht(summary.sales)}</span>
              </span>
            )}
            {fetching && <span className="sd-note">กำลังอัปเดต…</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

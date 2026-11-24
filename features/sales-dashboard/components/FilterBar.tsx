"use client";

import { SEARCH_FORM_FULL_ROW, SEARCH_FORM_GRID, SearchPanel } from "@/components/common/SearchPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatThaiDate } from "@/lib/thaiDate";
import {
  CHANNEL_OPTIONS,
  PRESETS,
  REGION_OPTIONS,
  matchPreset,
  isRangeValid,
  type DateRange,
  type PresetKey,
  formatBaht,
  daysInclusive,
} from "../lib/dashboard";
import type { SalesFilters, SalesSummary } from "../types/salesDashboard";
import { ThaiDateRangeInput } from "@/components/form/ThaiDateRangeInput";

/**
 * Filter panel of the dashboard, built on the shared SearchPanel so it reads
 * like the sidebar of every other backoffice screen: date range first, then the
 * quick presets, then channel and region. Channel pills and the region select
 * are optional so the members tab can render a date-only panel.
 */
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
  /** Omit to hide the channel pills (date-only bar). */
  onChannel?: (value: string) => void;
  /** Omit to hide the region select (date-only bar). */
  onRegion?: (value: string) => void;
  onReset: () => void;
}) {
  const activePreset = matchPreset({
    from: filters.dateFrom,
    to: filters.dateTo,
  });
  const valid = isRangeValid(draft.from, draft.to);
  const days = daysInclusive(filters.dateFrom, filters.dateTo);
  const activeCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.channel,
    filters.region,
  ].filter(Boolean).length;

  return (
    <SearchPanel onReset={onReset} activeFilterCount={activeCount}>
      <div className={SEARCH_FORM_GRID}>
        <div className="space-y-1.5">
          <Label htmlFor="sd-range">ช่วงวันที่</Label>
          <ThaiDateRangeInput
            id="sd-range"
            value={{ start: draft.from, end: draft.to }}
            onChange={(r) => onDraftChange({ from: r.start, to: r.end })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>ช่วงด่วน</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.key}
                onClick={() => onPreset(preset.key)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  activePreset === preset.key
                    ? "border-neutral-900 bg-neutral-900 font-medium text-white"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-100",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {onChannel && (
          <div className="space-y-1.5">
            <Label>ช่องทาง</Label>
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => onChannel(option.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    filters.channel === option.value
                      ? "border-neutral-900 bg-neutral-900 font-medium text-white"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-100",
                  )}
                >
                  <span aria-hidden>{option.icon}</span> {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {onRegion && (
          <div className="space-y-1.5">
            <Label htmlFor="sd-region">ภูมิภาค</Label>
            <Select
              id="sd-region"
              value={filters.region}
              onChange={(e) => onRegion(e.target.value)}
            >
              <option value="">ทุกภูมิภาค</option>
              {REGION_OPTIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </div>
        )}

        {!valid && (
          <p role="alert" className={`${SEARCH_FORM_FULL_ROW} text-xs text-red-600`}>
            ช่วงวันที่ต้องเรียงถูกและไม่เกิน 366 วัน
          </p>
        )}

        <div className={`${SEARCH_FORM_FULL_ROW} flex flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="space-y-1 text-xs text-neutral-500">
            <p>
              {days} วัน · {formatThaiDate(filters.dateFrom)} →{" "}
              {formatThaiDate(filters.dateTo)}
            </p>
            {summary && (
              <p>
                ยอดรวม{" "}
                <span className="font-medium text-neutral-900">
                  {formatBaht(summary.sales)}
                </span>
              </p>
            )}
            {fetching && <p>กำลังอัปเดต…</p>}
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto sm:min-w-32"
            onClick={onApply}
            disabled={!valid || fetching}
          >
            ใช้ช่วงนี้
          </Button>
        </div>
      </div>
    </SearchPanel>
  );
}

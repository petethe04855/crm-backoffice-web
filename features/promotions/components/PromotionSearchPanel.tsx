"use client";

import { useState, type FormEvent } from "react";
import { SearchPanel } from "@/components/common/SearchPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  EMPTY_PROMOTION_FILTERS,
  PLACEMENTS,
  PLACEMENT_LABEL,
  PROMOTION_STATUS_LABEL,
  type PromotionFilters,
} from "../types/promotion";

type Draft = Pick<PromotionFilters, "search" | "month" | "status" | "placement">;

function toDraft(f: PromotionFilters): Draft {
  return { search: f.search, month: f.month, status: f.status, placement: f.placement };
}

export function countActiveFilters(f: Draft): number {
  return [f.search.trim(), f.month, f.status, f.placement].filter(Boolean).length;
}

/** Column 1 of the promotion page: filters apply on submit, not per keystroke. */
export function PromotionSearchPanel({
  filters,
  onApply,
}: {
  filters: PromotionFilters;
  onApply: (next: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };

  const reset = () => {
    const empty = toDraft(EMPTY_PROMOTION_FILTERS);
    setDraft(empty);
    onApply(empty);
  };

  return (
    <SearchPanel onReset={reset} activeFilterCount={countActiveFilters(toDraft(filters))}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-search">ชื่อโปรโมชั่น</Label>
          <Input
            id="p-search"
            value={draft.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="ค้นหาจากชื่อ"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-month">เดือนที่แสดงผล</Label>
          <Input
            id="p-month"
            type="month"
            value={draft.month}
            onChange={(e) => set("month", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">แสดงโปรที่ช่วงวันคาบเกี่ยวเดือนนี้</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-status">สถานะ</Label>
          <Select
            id="p-status"
            value={draft.status}
            onChange={(e) => set("status", e.target.value as Draft["status"])}
          >
            <option value="">ทุกสถานะ</option>
            {Object.entries(PROMOTION_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-placement">ตำแหน่งที่แสดง</Label>
          <Select
            id="p-placement"
            value={draft.placement}
            onChange={(e) => set("placement", e.target.value as Draft["placement"])}
          >
            <option value="">ทุกตำแหน่ง</option>
            {PLACEMENTS.map((value) => (
              <option key={value} value={value}>
                {PLACEMENT_LABEL[value]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full">
          ค้นหา
        </Button>
      </form>
    </SearchPanel>
  );
}

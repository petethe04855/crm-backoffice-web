"use client";

import { useState, type FormEvent } from "react";
import { SEARCH_FORM_FULL_ROW, SEARCH_FORM_GRID, SEARCH_FORM_SUBMIT, SearchPanel } from "@/components/common/SearchPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EMPTY_MEMBER_FILTERS, MEMBER_STATUS_LABEL, type MemberFilters, type Tier } from "../types/member";
import { ThaiDateRangeInput } from "@/components/form/ThaiDateRangeInput";

type Draft = Pick<
  MemberFilters,
  "search" | "status" | "tierId" | "registeredFrom" | "registeredTo" | "minPoints" | "maxPoints" | "inactiveDays"
>;

function toDraft(f: MemberFilters): Draft {
  return {
    search: f.search,
    status: f.status,
    tierId: f.tierId,
    registeredFrom: f.registeredFrom,
    registeredTo: f.registeredTo,
    minPoints: f.minPoints,
    maxPoints: f.maxPoints,
    inactiveDays: f.inactiveDays,
  };
}

export function countActiveFilters(f: Draft): number {
  return [
    f.search.trim(),
    f.status,
    f.tierId,
    f.registeredFrom,
    f.registeredTo,
    f.minPoints.trim(),
    f.maxPoints.trim(),
    f.inactiveDays.trim(),
  ].filter(Boolean).length;
}

/** Returns a Thai message for an invalid point range / inactivity draft, else null. */
export function validateManageFilters(f: Pick<Draft, "minPoints" | "maxPoints" | "inactiveDays">): string | null {
  const whole = (v: string) => v.trim() === "" || /^\d+$/.test(v.trim());
  if (!whole(f.minPoints) || !whole(f.maxPoints)) return "แต้มต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
  if (f.minPoints.trim() && f.maxPoints.trim() && Number(f.minPoints) > Number(f.maxPoints)) {
    return "แต้มต่ำสุดต้องไม่เกินแต้มสูงสุด";
  }
  const days = f.inactiveDays.trim();
  if (days && (!/^\d+$/.test(days) || Number(days) < 1 || Number(days) > 3650)) {
    return "จำนวนวันต้องอยู่ระหว่าง 1–3650";
  }
  return null;
}

/** Column 1 of the member page: filters are applied on submit, not per keystroke. */
export function MemberSearchPanel({
  filters,
  tiers,
  onApply,
}: {
  filters: MemberFilters;
  tiers: Tier[];
  onApply: (next: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };
  const reset = () => {
    const empty = toDraft(EMPTY_MEMBER_FILTERS);
    setDraft(empty);
    onApply(empty);
  };
  const dateError =
    draft.registeredFrom && draft.registeredTo && draft.registeredFrom > draft.registeredTo
      ? "วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด"
      : null;
  const manageError = validateManageFilters(draft);

  return (
    <SearchPanel onReset={reset} activeFilterCount={countActiveFilters(toDraft(filters))}>
      <form onSubmit={submit} className={SEARCH_FORM_GRID}>
        <div className="space-y-1.5">
          <Label htmlFor="m-search">ค้นหา</Label>
          <Input
            id="m-search"
            value={draft.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="รหัส / ชื่อ / อีเมล / เบอร์"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-status">สถานะ</Label>
          <Select id="m-status" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
            <option value="">ทั้งหมด (ยกเว้นลบแล้ว)</option>
            {Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-tier">ระดับ</Label>
          <Select id="m-tier" value={draft.tierId} onChange={(e) => set("tierId", e.target.value)}>
            <option value="">ทุกระดับ</option>
            {tiers.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-registered">วันที่สมัคร</Label>
          <ThaiDateRangeInput
            id="m-registered"
            optional
            emptyStartLabel="ทั้งหมด"
            emptyEndLabel="ปัจจุบัน"
            value={{ start: draft.registeredFrom, end: draft.registeredTo }}
            onChange={(r) => {
              set("registeredFrom", r.start);
              set("registeredTo", r.end);
            }}
          />
        </div>
        {dateError && (
          <p role="alert" className={`${SEARCH_FORM_FULL_ROW} text-xs text-red-600`}>
            {dateError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="m-min-points">แต้มตั้งแต่</Label>
            <Input
              id="m-min-points"
              inputMode="numeric"
              value={draft.minPoints}
              onChange={(e) => set("minPoints", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-max-points">แต้มถึง</Label>
            <Input
              id="m-max-points"
              inputMode="numeric"
              value={draft.maxPoints}
              onChange={(e) => set("maxPoints", e.target.value)}
              placeholder="ไม่จำกัด"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-inactive">ไม่ได้ใช้งานเกิน (วัน)</Label>
          <Input
            id="m-inactive"
            inputMode="numeric"
            value={draft.inactiveDays}
            onChange={(e) => set("inactiveDays", e.target.value)}
            placeholder="เช่น 90"
          />
        </div>
        {manageError && (
          <p role="alert" className={`${SEARCH_FORM_FULL_ROW} text-xs text-red-600`}>
            {manageError}
          </p>
        )}
        <Button type="submit" className={SEARCH_FORM_SUBMIT} disabled={Boolean(dateError || manageError)}>
          ค้นหา
        </Button>
      </form>
    </SearchPanel>
  );
}

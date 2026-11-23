"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatThaiDate, formatThaiDateTimeInput } from "@/lib/thaiDate";

/** A start/end pair as ISO strings ("" = unset). */
export interface DateRange {
  start: string;
  end: string;
}

const BE = 543;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n: number) => String(n).padStart(2, "0");

function datePart(iso: string): string {
  return iso.slice(0, 10);
}
function timePart(iso: string, fallback: string): string {
  const m = /T(\d{2}:\d{2})/.exec(iso);
  return m ? m[1] : fallback;
}
function toDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : undefined;
}
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * One field for a start–end range, picked on a shadcn/ui range Calendar in a
 * Popover: Thai month/weekday names, Buddhist-era years, 24-hour clock.
 *
 * Values are the ISO strings the API uses ("2026-11-23" or, withTime,
 * "2026-11-23T14:30"). The first click sets the start, the second the end.
 * With `optional`, either side may stay unset and is shown with
 * `emptyStartLabel` / `emptyEndLabel` (e.g. "ทันที" / "ไม่มีกำหนด").
 */
export function ThaiDateRangeInput({
  id,
  value,
  onChange,
  withTime = false,
  optional = false,
  emptyStartLabel = "ไม่กำหนด",
  emptyEndLabel = "ไม่กำหนด",
  startTimeLabel = "เวลาเริ่ม",
  endTimeLabel = "เวลาสิ้นสุด",
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
  withTime?: boolean;
  optional?: boolean;
  emptyStartLabel?: string;
  emptyEndLabel?: string;
  startTimeLabel?: string;
  endTimeLabel?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}) {
  const [open, setOpen] = useState(false);
  const from = toDate(value.start);
  const to = toDate(value.end);
  const [month, setMonth] = useState<Date>(() => from ?? new Date());

  const startTime = timePart(value.start, "00:00");
  const endTime = timePart(value.end, "23:59");
  const withT = (date: string, time: string) => (date && withTime ? `${date}T${time}` : date);

  const show = (iso: string) => (withTime ? formatThaiDateTimeInput(iso) : formatThaiDate(iso));
  const text =
    !value.start && !value.end
      ? ""
      : `${value.start ? show(value.start) : emptyStartLabel} – ${value.end ? show(value.end) : emptyEndLabel}`;

  /** First click = start; next click on/after it = end; else start again. */
  const pick = (day: Date) => {
    const d = toISODate(day);
    const s = datePart(value.start);
    const e = datePart(value.end);
    if (!s && e && d <= e) {
      // start was left open: set it and keep the end
      onChange({ start: withT(d, startTime), end: value.end });
      return;
    }
    if (!s || (s && value.end) || d < s) {
      onChange({ start: withT(d, startTime), end: "" });
      return;
    }
    onChange({ start: value.start, end: withT(d, endTime) });
    if (!withTime) setOpen(false);
  };

  const setTime = (side: "start" | "end", h: number, m: number) => {
    const iso = side === "start" ? value.start : value.end;
    if (!iso) return;
    onChange({ ...value, [side]: `${datePart(iso)}T${pad(h)}:${pad(m)}` });
  };

  const timeRow = (side: "start" | "end", label: string) => {
    const iso = side === "start" ? value.start : value.end;
    const [h, m] = (side === "start" ? startTime : endTime).split(":").map(Number);
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-20 text-muted-foreground">{label}</span>
        <Select
          aria-label={`${label} ชั่วโมง`}
          className="h-8 w-[4.5rem] tabular-nums"
          value={h}
          disabled={!iso}
          onChange={(e) => setTime(side, Number(e.target.value), m)}
        >
          {HOURS.map((x) => (
            <option key={x} value={x}>
              {pad(x)}
            </option>
          ))}
        </Select>
        <span>:</span>
        <Select
          aria-label={`${label} นาที`}
          className="h-8 w-[4.5rem] tabular-nums"
          value={m}
          disabled={!iso}
          onChange={(e) => setTime(side, h, Number(e.target.value))}
        >
          {MINUTES.map((x) => (
            <option key={x} value={x}>
              {pad(x)}
            </option>
          ))}
        </Select>
        <span className="text-muted-foreground">น.</span>
      </div>
    );
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          data-invalid={ariaInvalid === true || ariaInvalid === "true" ? "true" : undefined}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[invalid=true]:border-destructive",
            className,
          )}
        >
          <span className={cn("truncate tabular-nums", !text && "text-muted-foreground")}>
            {text || (withTime ? "วว/ดด/ปปปป ชช:นน – วว/ดด/ปปปป ชช:นน" : "วว/ดด/ปปปป – วว/ดด/ปปปป")}
          </span>
          <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <div role="dialog" aria-label="เลือกช่วงวันที่">
          <Calendar
            mode="range"
            numberOfMonths={2}
            month={month}
            onMonthChange={setMonth}
            selected={{ from, to }}
            onSelect={(_, day) => pick(day)}
            labels={{
              labelPrevious: () => "เดือนก่อน",
              labelNext: () => "เดือนถัดไป",
              labelDayButton: (d) =>
                `${d.getDate()} ${new Intl.DateTimeFormat("th-TH", { month: "long" }).format(d)} ${d.getFullYear() + BE}`,
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            {!value.start ? "เลือกวันเริ่มต้น" : !value.end ? "เลือกวันสิ้นสุด" : text}
          </p>
          {withTime && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {timeRow("start", startTimeLabel)}
              {timeRow("end", endTimeLabel)}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-0 text-muted-foreground"
              onClick={() => onChange({ start: "", end: "" })}
            >
              ล้าง
            </Button>
            {optional && value.start && (
              <Button type="button" variant="ghost" size="sm" className="min-h-0" onClick={() => onChange({ ...value, start: "" })}>
                ไม่กำหนดวันเริ่ม ({emptyStartLabel})
              </Button>
            )}
            {optional && value.end && (
              <Button type="button" variant="ghost" size="sm" className="min-h-0" onClick={() => onChange({ ...value, end: "" })}>
                ไม่กำหนดวันสิ้นสุด ({emptyEndLabel})
              </Button>
            )}
            <Button type="button" size="sm" className="ml-auto min-h-0" onClick={() => setOpen(false)}>
              ตกลง
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Picker body for ThaiDateInput, built on shadcn/ui (Calendar = react-day-picker,
 * Button, Select). Thai month and weekday names, Buddhist-era years and a
 * 24-hour clock (00–23) — the browser's own picker follows the operating
 * system's language and AM/PM setting, which the page cannot change.
 *
 * Values are the ISO strings the API uses: "2026-11-23", "2026-11-23T14:30",
 * or "2026-11" for kind="month".
 */

const BE = 543;
const MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n: number) => String(n).padStart(2, "0");

/** Today in Bangkok as [year, month(1-12), day]. */
function bangkokToday(): [number, number, number] {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return [y, m, d];
}

function parse(
  value: string,
): { y: number; m: number; d: number; hh: number; mm: number } | null {
  const r = /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!r) return null;
  return {
    y: +r[1],
    m: +r[2],
    d: r[3] ? +r[3] : 1,
    hh: r[4] ? +r[4] : 0,
    mm: r[5] ? +r[5] : 0,
  };
}

export type CalendarKind = "date" | "datetime" | "month";

export function ThaiCalendar({
  kind,
  value,
  onSelect,
  onClose,
}: {
  kind: CalendarKind;
  value: string;
  /** Called with the new ISO value ("" for clear). */
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const [ty, tm, td] = bangkokToday();
  const cur = parse(value);
  const [hh, setHh] = useState(cur?.hh ?? 0);
  const [mm, setMm] = useState(cur?.mm ?? 0);
  const [viewYear, setViewYear] = useState(cur?.y ?? ty);
  const [month, setMonth] = useState(
    () => new Date(cur?.y ?? ty, (cur?.m ?? tm) - 1, 1),
  );

  const commitDay = (y: number, m: number, d: number, h = hh, mi = mm) => {
    const date = `${y}-${pad(m)}-${pad(d)}`;
    if (kind === "datetime") {
      onSelect(`${date}T${pad(h)}:${pad(mi)}`);
      return; // stay open so the time can be set next
    }
    onSelect(date);
    onClose();
  };

  const footer = (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-0 text-muted-foreground"
        onClick={() => {
          onSelect("");
          onClose();
        }}
      >
        ล้าง
      </Button>
      {kind === "month" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-0"
          onClick={() => {
            onSelect(`${ty}-${pad(tm)}`);
            onClose();
          }}
        >
          เดือนนี้
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-0"
          onClick={() => {
            setMonth(new Date(ty, tm - 1, 1));
            commitDay(ty, tm, td);
          }}
        >
          วันนี้
        </Button>
      )}
      {kind === "datetime" && (
        <Button type="button" size="sm" className="min-h-0" onClick={onClose}>
          ตกลง
        </Button>
      )}
    </div>
  );

  if (kind === "month") {
    return (
      <div role="dialog" aria-label="เลือกเดือน" className="w-64">
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 min-h-0"
            aria-label="ปีก่อน"
            onClick={() => setViewYear(viewYear - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-sm font-semibold" aria-live="polite">
            พ.ศ. {viewYear + BE}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 min-h-0"
            aria-label="ปีถัดไป"
            onClick={() => setViewYear(viewYear + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS_SHORT.map((name, i) => {
            const selected = cur?.y === viewYear && cur?.m === i + 1;
            const isNow = ty === viewYear && tm === i + 1;
            return (
              <Button
                type="button"
                key={name}
                variant={selected ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "min-h-0",
                  !selected && isNow && "ring-1 ring-inset ring-neutral-400",
                )}
                aria-pressed={selected}
                onClick={() => {
                  onSelect(`${viewYear}-${pad(i + 1)}`);
                  onClose();
                }}
              >
                {name}
              </Button>
            );
          })}
        </div>
        {footer}
      </div>
    );
  }

  const selected = cur ? new Date(cur.y, cur.m - 1, cur.d) : undefined;
  const today = new Date(ty, tm - 1, td);

  return (
    <div
      role="dialog"
      aria-label={kind === "datetime" ? "เลือกวันและเวลา" : "เลือกวันที่"}
    >
      <Calendar
        mode="single"
        selected={selected}
        today={today}
        month={month}
        onMonthChange={setMonth}
        onSelect={(d) => {
          if (d) commitDay(d.getFullYear(), d.getMonth() + 1, d.getDate());
        }}
        labels={{
          labelPrevious: () => "เดือนก่อน",
          labelNext: () => "เดือนถัดไป",
          labelDayButton: (d) =>
            `${d.getDate()} ${new Intl.DateTimeFormat("th-TH", { month: "long" }).format(d)} ${d.getFullYear() + BE}`,
        }}
      />

      {kind === "datetime" && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">เวลา</span>
          <Select
            aria-label="ชั่วโมง"
            className="h-8 w-[4.5rem] tabular-nums"
            value={hh}
            onChange={(e) => {
              const h = Number(e.target.value);
              setHh(h);
              if (cur) commitDay(cur.y, cur.m, cur.d, h, mm);
            }}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {pad(h)}
              </option>
            ))}
          </Select>
          <span>:</span>
          <Select
            aria-label="นาที"
            className="h-8 w-[4.5rem] tabular-nums"
            value={mm}
            onChange={(e) => {
              const mi = Number(e.target.value);
              setMm(mi);
              if (cur) commitDay(cur.y, cur.m, cur.d, hh, mi);
            }}
          >
            {MINUTES.map((mi) => (
              <option key={mi} value={mi}>
                {pad(mi)}
              </option>
            ))}
          </Select>
          <span className="text-muted-foreground">น.</span>
        </div>
      )}
      {footer}
    </div>
  );
}

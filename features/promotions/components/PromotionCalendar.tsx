"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePromotionList } from "../hooks/usePromotions";
import { daysInMonth, layoutMonth, monthKey, monthLabel, parseMonth, shiftMonth } from "../lib/calendar";
import {
  EMPTY_PROMOTION_FILTERS,
  type PromotionDisplayStatus,
} from "../types/promotion";
import { PromotionStatusBadge } from "./PromotionStatusBadge";
import { ThaiDateInput } from "@/components/form/ThaiDateInput";

/** Bar colours by computed status, so overlaps are readable at a glance. */
const BAR_CLASS: Record<PromotionDisplayStatus, string> = {
  draft: "bg-amber-400",
  scheduled: "bg-sky-500",
  live: "bg-emerald-500",
  expired: "bg-neutral-400",
  archived: "bg-neutral-300",
};

/**
 * Month view of the display windows: one row per promotion, one cell per day.
 * Promotions that overlap are visible as stacked bars, and a bar is clipped to
 * the month the way the API filters it.
 */
export function PromotionCalendar() {
  const [month, setMonth] = useState(() => monthKey());
  const query = usePromotionList({ ...EMPTY_PROMOTION_FILTERS, month, limit: 100 });

  const days = daysInMonth(month);
  const [year, monthNumber] = parseMonth(month);
  const rows = layoutMonth(month, query.data?.data ?? []);
  const dayList = Array.from({ length: days }, (_, i) => i + 1);
  const gridTemplateColumns = `minmax(190px, 230px) repeat(${days}, minmax(16px, 1fr))`;
  const isWeekend = (day: number) => {
    const weekday = new Date(year, monthNumber - 1, day).getDay();
    return weekday === 0 || weekday === 6;
  };

  return (
    <>
      <PageHeader
        title="ปฏิทินโปรโมชั่น"
        description="แถบช่วงวันของแต่ละโปรในเดือนที่เลือก — เห็นช่วงที่ซ้อนกันชัดเจน"
        actions={
          <Link href="/promotions" className="text-sm text-primary underline-offset-4 hover:underline">
            กลับไปหน้ารายการ
          </Link>
        }
      />

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="เดือนก่อนหน้า"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="เดือนถัดไป"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <ThaiDateInput
            kind="month"
            aria-label="เลือกเดือน"
            className="w-44"
            value={month}
            onChange={(v) => {
              if (v) setMonth(v);
            }}
          />
          <span className="text-sm font-semibold">{monthLabel(month)}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {rows.length} โปรในเดือนนี้
          </span>
        </div>

        {query.isLoading ? (
          <Loading message="กำลังโหลดปฏิทิน…" />
        ) : query.isError ? (
          <ErrorState message="โหลดปฏิทินไม่สำเร็จ" onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="ยังไม่มีโปรโมชั่นในเดือนนี้"
            description="สร้างโปรใหม่หรือเลือกเดือนอื่นจากตัวเลือกด้านบน"
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div
                className="grid border-b border-neutral-200 bg-neutral-50"
                style={{ gridTemplateColumns }}
              >
                <div className="px-3 py-2 text-xs font-medium text-neutral-600">โปรโมชั่น</div>
                {dayList.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "py-2 text-center text-[11px] text-neutral-500",
                      isWeekend(day) && "bg-neutral-100",
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {rows.map(({ promotion, bar }) => {
                const lastDay = bar.startDay + bar.spanDays - 1;
                return (
                  <div
                    key={promotion.id}
                    className="grid items-center border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60"
                    style={{ gridTemplateColumns }}
                  >
                    <div className="min-w-0 px-3 py-2">
                      <Link
                        href={`/promotions/${promotion.id}`}
                        className="line-clamp-1 text-sm font-medium text-neutral-900 hover:underline"
                        title={promotion.title}
                      >
                        {promotion.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <PromotionStatusBadge status={promotion.displayStatus} />
                      </div>
                    </div>

                    {dayList.map((day) => {
                      const inRange = day >= bar.startDay && day <= lastDay;
                      return (
                        <div
                          key={day}
                          className={cn(
                            "h-8 px-px py-2",
                            isWeekend(day) && "bg-neutral-50",
                          )}
                          title={
                            inRange
                              ? `${promotion.title} — วันที่ ${day}`
                              : undefined
                          }
                        >
                          {inRange && (
                            <div
                              className={cn(
                                "h-4",
                                BAR_CLASS[promotion.displayStatus],
                                day === bar.startDay && "rounded-l-full",
                                day === lastDay && "rounded-r-full",
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

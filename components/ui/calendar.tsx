"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { th } from "react-day-picker/locale";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "พฤศจิกายน 2569": Thai month name, Buddhist-era year. */
function formatThaiCaption(month: Date): string {
  const name = new Intl.DateTimeFormat("th-TH", { month: "long" }).format(
    month,
  );
  return `${name} ${month.getFullYear() + 543}`;
}

/**
 * shadcn/ui Calendar (react-day-picker v9), Thai by default: Thai locale
 * (month and weekday names, week starts Sunday) and Buddhist-era years in the
 * caption. Styled for Tailwind v3 with the backoffice tokens.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  formatters,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={th}
      weekStartsOn={0}
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      formatters={{ formatCaption: formatThaiCaption, ...formatters }}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "space-y-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 min-h-0 p-0 text-muted-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 min-h-0 p-0 text-muted-foreground",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-normal text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 min-h-0 p-0 font-normal tabular-nums aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        // Range: dark ends, light middle (as in shadcn's range calendar).
        range_start: "rounded-l-md bg-secondary",
        range_end: "rounded-r-md bg-secondary",
        range_middle:
          "bg-secondary [&>button]:!bg-transparent [&>button]:!text-foreground [&>button]:hover:!bg-neutral-200",
        today:
          "[&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-neutral-400",
        outside: "[&>button]:text-muted-foreground/60",
        disabled: "[&>button]:opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

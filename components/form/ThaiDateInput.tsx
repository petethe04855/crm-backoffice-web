"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThaiCalendar } from "./ThaiCalendar";
import { cn } from "@/lib/utils";
import {
  formatThaiDate,
  formatThaiDateTimeInput,
  formatThaiMonth,
  parseThaiDate,
  parseThaiDateTime,
  parseThaiMonth,
} from "@/lib/thaiDate";

type Kind = "date" | "datetime" | "month";

const PLACEHOLDER: Record<Kind, string> = {
  date: "วว/ดด/ปปปป",
  datetime: "วว/ดด/ปปปป ชช:นน",
  month: "ดด/ปปปป",
};

const FORMAT: Record<Kind, (iso: string) => string> = {
  date: formatThaiDate,
  datetime: formatThaiDateTimeInput,
  month: formatThaiMonth,
};

const PARSE: Record<Kind, (text: string) => string | null> = {
  date: parseThaiDate,
  datetime: parseThaiDateTime,
  month: parseThaiMonth,
};

/**
 * A date field that reads and writes Thai.
 *
 * The value in and out is the ISO string the API uses ("2026-11-23",
 * "2026-11-23T14:30", "2026-11"). What the user sees and types is the Thai
 * convention: DD/MM/YYYY in the Buddhist era, 24-hour time. A native
 * `<input type="date">` cannot do this — it always renders in the browser's own
 * locale — so this keeps the text in local state and only commits a parsed
 * value, leaving the previous value in place while the text is incomplete.
 *
 * The calendar button opens a Thai calendar in a shadcn/ui Popover (Thai
 * months, Buddhist-era years, 24-hour time). The browser's own picker is not used: its language and its
 * AM/PM clock follow the operating system and cannot be changed by the page.
 */
export function ThaiDateInput({
  kind = "date",
  value,
  onChange,
  id,
  name,
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  kind?: Kind;
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}) {
  const [text, setText] = useState(() => FORMAT[kind](value));
  const [shown, setShown] = useState(value);
  const [open, setOpen] = useState(false);

  // Follow the value when it changes from outside (reset, preset, calendar,
  // server load): adjust state during render instead of in an effect.
  if (value !== shown) {
    setShown(value);
    setText(FORMAT[kind](value));
  }

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>
          <Input
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={PLACEHOLDER[kind]}
            value={text}
            disabled={disabled}
            required={required}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            className="pr-10 tabular-nums"
            onChange={(e) => {
              const next = e.target.value;
              setText(next);
              if (next.trim() === "") {
                onChange("");
                return;
              }
              const iso = PARSE[kind](next);
              if (iso !== null) onChange(iso);
            }}
            onBlur={() => {
              // Snap the text back to the canonical Thai form (or clear a bad entry).
              setText(FORMAT[kind](value));
            }}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={disabled}
              aria-label="เลือกจากปฏิทิน"
              title="เลือกจากปฏิทิน"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <ThaiCalendar
          kind={kind}
          value={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useId } from "react";
import { ThaiDateRangeInput } from "./ThaiDateRangeInput";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** A start/end pair as the inputs store it ("" means unset). */
export interface DateRangeValue {
  start: string;
  end: string;
}

/**
 * Returns a Thai error message when the range is impossible, or null.
 *
 * The values are ISO strings, so a plain string comparison is chronological:
 * "2026-11-18" sorts before "2026-11-19", and the same holds for
 * datetime-local values ("2026-11-18T09:00" < "2026-11-18T10:00"). An unset
 * side is not an error by itself; required-ness belongs to the caller's schema.
 */
export function validateDateRange(start: string, end: string): string | null {
  if (start && end && start > end) {
    return "วันเริ่มต้นต้องไม่เกินวันสิ้นสุด";
  }
  return null;
}

export interface DateRangeFieldProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  startLabel?: string;
  endLabel?: string;
  /** Renders datetime-local inputs instead of date inputs. */
  withTime?: boolean;
  disabled?: boolean;
  /** Server-side error shown instead of the computed one. */
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Start/end pickers with ordering validation. Only presentation lives here;
 * the feature keeps the value and decides what to do with it.
 */
export function DateRangeField({
  value,
  onChange,
  label,
  startLabel = "วันเริ่มต้น",
  endLabel = "วันสิ้นสุด",
  withTime = false,
  disabled = false,
  error,
  className,
}: DateRangeFieldProps) {
  const id = useId();
  const message = error ?? validateDateRange(value.start, value.end);
  const invalid = message !== null && message !== undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={`${id}-start`}>{label}</Label>}
      <ThaiDateRangeInput
        id={`${id}-start`}
        withTime={withTime}
        value={value}
        disabled={disabled}
        aria-label={label ? undefined : `${startLabel} – ${endLabel}`}
        aria-invalid={invalid || undefined}
        startTimeLabel={`เวลา${startLabel.replace(/^วัน/, "")}`}
        endTimeLabel={`เวลา${endLabel.replace(/^วัน/, "")}`}
        onChange={onChange}
      />
      {invalid && (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}

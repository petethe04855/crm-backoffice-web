import { Eye, EyeOff, Clock } from "lucide-react";
import { cn, formatThaiDateTime } from "@/lib/utils";
import { LINE_VISIBILITY_HINT, LINE_VISIBILITY_LABEL, type LineVisibility } from "../types/lineVisibility";

function tone(v: LineVisibility): string {
  if (v.visible) return "border-green-200 bg-green-50 text-green-800";
  if (v.reason === "not_started") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-neutral-200 bg-neutral-50 text-neutral-600";
}

function Icon({ v, className }: { v: LineVisibility; className?: string }) {
  if (v.visible) return <Eye aria-hidden="true" className={className} />;
  if (v.reason === "not_started") return <Clock aria-hidden="true" className={className} />;
  return <EyeOff aria-hidden="true" className={className} />;
}

/** Compact LINE OA status for list rows. */
export function LineVisibilityBadge({ value }: { value?: LineVisibility | null }) {
  if (!value) return <span className="text-neutral-400">—</span>;
  const label =
    value.reason === "not_started" && value.from
      ? `รอเริ่ม ${formatThaiDateTime(value.from)}`
      : LINE_VISIBILITY_LABEL[value.reason] ?? value.reason;
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tone(value))}
      title={LINE_VISIBILITY_HINT[value.reason]}
    >
      <Icon v={value} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/** LINE OA status with what to do next, for add / edit forms. */
export function LineVisibilityPanel({ value }: { value?: LineVisibility | null }) {
  if (!value) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        <p className="font-medium">LINE OA: ยังไม่แสดง</p>
        <p className="mt-1 text-xs">บันทึกก่อน แล้วกด &quot;บันทึกและแสดงใน LINE OA&quot; เพื่อให้สมาชิกเห็น</p>
      </div>
    );
  }
  return (
    <div role="status" className={cn("rounded-xl border p-4 text-sm", tone(value))}>
      <p className="flex items-center gap-1.5 font-medium">
        <Icon v={value} className="h-4 w-4" />
        LINE OA: {LINE_VISIBILITY_LABEL[value.reason] ?? value.reason}
      </p>
      <p className="mt-1 text-xs">{LINE_VISIBILITY_HINT[value.reason]}</p>
      {value.reason === "not_started" && value.from && (
        <p className="mt-1 text-xs">เริ่มแสดง {formatThaiDateTime(value.from)}</p>
      )}
      {value.visible && value.until && <p className="mt-1 text-xs">แสดงถึง {formatThaiDateTime(value.until)}</p>}
    </div>
  );
}

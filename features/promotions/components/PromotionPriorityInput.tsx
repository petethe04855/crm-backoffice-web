"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { toast } from "@/components/common/Toaster";
import { Input } from "@/components/ui/input";
import { useSetPromotionPriority } from "../hooks/usePromotions";
import type { Promotion } from "../types/promotion";

export const MAX_PROMOTION_PRIORITY = 9999;

/**
 * The LINE OA display position the text holds: 1 shows first, an empty box
 * (or 0) means "not set" and is shown after the numbered ones. null = invalid.
 */
export function parsePriority(text: string): number | null {
  const v = text.trim();
  if (v === "") return 0;
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n <= MAX_PROMOTION_PRIORITY ? n : null;
}

/**
 * LINE OA display-order cell of the promotion table (1 = first, empty = not
 * set). Saves on blur or Enter; Escape puts the stored value back.
 */
/** The other non-archived row on this page that already holds position n, if any. */
export function findPriorityHolder(n: number, self: Promotion, rows: Promotion[]): Promotion | undefined {
  if (n === 0) return undefined;
  return rows.find((r) => r.id !== self.id && r.status !== "archived" && r.priority === n);
}

export function PromotionPriorityInput({
  promotion,
  canManage,
  others = [],
}: {
  promotion: Promotion;
  canManage: boolean;
  /** Rows on the current page, for an instant duplicate check (the API checks every page). */
  others?: Promotion[];
}) {
  const save = useSetPromotionPriority();
  // null while not editing, so the cell follows the server value after a refetch.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const text =
    draft ?? (promotion.priority === 0 ? "" : String(promotion.priority));
  // Set by Escape so the blur that follows does not save the abandoned text.
  const cancelled = useRef(false);

  if (!canManage || promotion.status === "archived") {
    return (
      <span className="tabular-nums">
        {promotion.priority === 0 ? "–" : promotion.priority}
      </span>
    );
  }

  const commit = async () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const next = parsePriority(text);
    if (next === null) {
      setError(`ใส่เลข 1–${MAX_PROMOTION_PRIORITY} หรือเว้นว่าง`);
      return;
    }
    setError(null);
    if (next === promotion.priority) {
      setDraft(null);
      return;
    }
    const holder = findPriorityHolder(next, promotion, others);
    if (holder) {
      const message = `ลำดับ ${next} ถูกใช้แล้วโดย "${holder.title}"`;
      setError(message);
      toast.error(message);
      return;
    }
    try {
      await save.mutateAsync({ id: promotion.id, priority: next });
      setDraft(null);
      toast.success(
        next === 0
          ? `ยกเลิกลำดับของ "${promotion.title}" แล้ว (แสดงต่อท้ายใน LINE OA)`
          : `บันทึกลำดับของ "${promotion.title}" เป็น ${next} แล้ว`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "บันทึกลำดับไม่สำเร็จ";
      setError(message);
      toast.error(message);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      cancelled.current = true;
      setDraft(null);
      setError(null);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="w-20">
      <Input
        aria-label={`ลำดับที่แสดงใน LINE OA ของ ${promotion.title}`}
        title="ลำดับที่แสดงใน LINE OA (1 = แสดงก่อน, เว้นว่าง = ต่อท้าย) — กด Enter เพื่อบันทึก"
        placeholder="–"
        inputMode="numeric"
        type="number"
        min={1}
        className="h-8 text-center tabular-nums"
        value={text}
        disabled={save.isPending}
        aria-invalid={error ? true : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={onKeyDown}
      />
      {error && (
        <p role="alert" className="mt-1 text-[11px] leading-tight text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

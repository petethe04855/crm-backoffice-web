"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One action that may be unavailable for this row (with the reason why). */
export interface RowAction {
  label: string;
  /** Runs the action; return a promise so the row shows it is busy. */
  run: () => Promise<unknown>;
  /** When set, the button is disabled and this is shown as its tooltip. */
  disabledReason?: string;
}

/**
 * "show / edit / delete" buttons for the right-hand column of a list row.
 * Delete always asks for confirmation; errors are shown under the buttons.
 */
export function RowActions({
  show,
  editHref,
  remove,
  confirmDelete,
}: {
  show?: RowAction;
  editHref: string;
  remove?: RowAction;
  /** Confirmation text for delete. */
  confirmDelete: string;
}) {
  const [busy, setBusy] = useState<"show" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exec(kind: "show" | "delete", action: RowAction) {
    if (kind === "delete" && !window.confirm(confirmDelete)) return;
    setBusy(kind);
    setError(null);
    try {
      await action.run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-1.5">
        {show && (
          <span title={show.disabledReason}>
            <Button
              type="button"
              size="sm"
              disabled={Boolean(show.disabledReason) || busy !== null}
              onClick={() => exec("show", show)}
            >
              <Eye aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
              {busy === "show" ? "กำลังเปิด…" : show.label}
            </Button>
          </span>
        )}
        <Link href={editHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <Pencil aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
          แก้ไข
        </Link>
        {remove && (
          <span title={remove.disabledReason}>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={Boolean(remove.disabledReason) || busy !== null}
              onClick={() => exec("delete", remove)}
            >
              <Trash2 aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
              {busy === "delete" ? "กำลังลบ…" : remove.label}
            </Button>
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-xs whitespace-normal text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

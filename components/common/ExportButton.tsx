"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveBlob } from "@/lib/download";
import { cn } from "@/lib/utils";

/** What an export call returns: the bytes plus the name to save them under. */
export interface ExportPayload {
  blob: Blob;
  filename: string;
}

export interface ExportButtonProps {
  /** Fetches the file. Called on every click, so it may be a mutation or a plain request. */
  onExport: () => Promise<ExportPayload>;
  label?: string;
  loadingLabel?: string;
  /** Error to show before the first click (e.g. a missing permission). */
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
}

/**
 * A download button for any blob-producing endpoint (member export today,
 * promotions/rewards/coupons later). It owns loading, error and the actual
 * save, so features only supply the request.
 */
export function ExportButton({
  onExport,
  label = "ส่งออก",
  loadingLabel = "กำลังสร้างไฟล์…",
  disabled = false,
  disabledHint,
  className,
}: ExportButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const { blob, filename } = await onExport();
      saveBlob(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  const message = error ?? (disabled ? disabledHint : undefined);

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || pending}
        aria-busy={pending}
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {pending ? loadingLabel : label}
      </Button>
      {message && (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}

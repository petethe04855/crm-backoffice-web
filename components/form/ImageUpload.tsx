"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_IMAGE_BYTES,
} from "@/features/uploads/api/uploadsApi";
import { useUploadImage } from "@/features/uploads/hooks/useUploadImage";
import type { UploadedImage } from "@/features/uploads/types/upload";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

/**
 * Fast client-side feedback only: the API is the source of truth and checks
 * the magic bytes and the size again.
 */
export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return "รูปต้องมีขนาดไม่เกิน 2 MB";
  }
  if (file.type && !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "รองรับเฉพาะไฟล์ jpg, png และ webp";
  }
  return null;
}

export interface ImageUploadProps {
  /** Current image URL (empty when none). */
  value?: string;
  /** Called with the public URL after a successful upload, or "" on remove. */
  onChange: (url: string) => void;
  /** Extra callback for callers that need the id too. */
  onUploaded?: (image: UploadedImage) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  /** Validation message from the form (e.g. a required image). */
  error?: string;
}

/**
 * Pick → preview → upload, with the request delegated to the uploads feature
 * hook (no axios here). While the upload runs the local object URL is shown;
 * on success the parent receives the server URL.
 */
export function ImageUpload({
  value,
  onChange,
  onUploaded,
  label = "รูปภาพ",
  hint = "jpg, png หรือ webp ขนาดไม่เกิน 2 MB",
  disabled = false,
  className,
  error: fieldError,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The object URL is ours to free; revoke it when it is replaced or the
  // component goes away.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? (value ? mediaUrl(value) : null);
  const busy = upload.isPending;

  function handleSelect(file: File | undefined) {
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);

    const objectUrl = URL.createObjectURL(file);
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return objectUrl;
    });

    upload.mutate(file, {
      onSuccess: (image) => {
        onChange(image.url);
        onUploaded?.(image);
      },
      onError: (err) => {
        setError(err.message);
      },
    });
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted",
            fieldError && !shown && "border-destructive bg-red-50",
          )}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded files live on the API host
            <img src={shown} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">กำลังอัปโหลด</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT_ATTRIBUTE}
            disabled={disabled || busy}
            className="hidden"
            onChange={(e) => handleSelect(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            >
              {shown ? "เปลี่ยนรูป" : "เลือกรูป"}
            </Button>
            {shown && (
              <Button type="button" variant="ghost" size="sm" disabled={disabled || busy} onClick={clear}>
                <X className="mr-1 h-4 w-4" aria-hidden="true" />
                ลบรูป
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>

      {(error || (fieldError && !shown)) && (
        <p role="alert" className="text-xs text-destructive">
          {error ?? fieldError}
        </p>
      )}
    </div>
  );
}

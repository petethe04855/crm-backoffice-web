"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Switch + label + inline error for a public/unpublic status column. Each module
 * owns the mutation; this only renders it so all three tables look identical.
 */
export function PublicToggle({
  checked,
  label,
  pending = false,
  onChange,
  titleOn,
  titleOff,
  error,
}: {
  checked: boolean;
  label: string;
  pending?: boolean;
  onChange: (next: boolean) => void;
  titleOn?: string;
  titleOff?: string;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Switch
          checked={checked}
          disabled={pending}
          onCheckedChange={onChange}
          title={checked ? titleOff : titleOn}
        />
        <span
          className={cn(
            "text-xs font-medium",
            checked ? "text-primary" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>
      {error && (
        <span className="max-w-[180px] whitespace-normal text-[10px] text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
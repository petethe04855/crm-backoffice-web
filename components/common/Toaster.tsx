"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const TOAST_MS = 4000;
let nextId = 1;

const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (kind, message) => {
    const id = nextId++;
    set({ items: [...get().items, { id, kind, message }] });
    setTimeout(() => get().dismiss(id), TOAST_MS);
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

/** Short pop-up notices in the top-right corner; they close by themselves. */
export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
};

/** Mount once (AdminShell) to show the notices raised with `toast`. */
export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {items.map((t) => {
        const Icon = t.kind === "success" ? CheckCircle2 : XCircle;
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg",
              t.kind === "success" ? "border-emerald-200" : "border-red-200",
            )}
          >
            <Icon
              className={cn("mt-0.5 h-4 w-4 shrink-0", t.kind === "success" ? "text-emerald-600" : "text-red-600")}
              aria-hidden="true"
            />
            <p className="flex-1 text-neutral-800">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-neutral-400 hover:text-neutral-700"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

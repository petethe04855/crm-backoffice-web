"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ThaiDateInput } from "@/components/form/ThaiDateInput";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SKUSelect } from "@/features/rewards/components/RewardForm";
import { batchFormSchema, type BatchFormValues } from "../schemas/batchForm";

interface BatchFormProps {
  initialValues: BatchFormValues;
  submitLabel: string;
  isPending: boolean;
  serverError?: string | null;
  readOnly?: boolean;
  cancelHref?: string;
  onSubmit: (values: BatchFormValues) => void;
}

/** Shared form for creating or editing a draft product-code batch. */
export function BatchForm({
  initialValues,
  submitLabel,
  isPending,
  serverError,
  readOnly = false,
  cancelHref = "/product-codes",
  onSubmit,
}: BatchFormProps) {
  const [form, setForm] = useState<BatchFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof BatchFormValues>(
    key: K,
    value: BatchFormValues[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const parsed = batchFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }
    if (!parsed.data.isTest && !parsed.data.lotNumber) {
      if (
        !window.confirm(
          "ยังไม่ระบุเลขล็อตสินค้า — เปิดใช้งานไม่ได้จนกว่าจะระบุ บันทึกเป็นร่างไว้ก่อน?",
        )
      ) {
        return;
      }
    }
    setError(null);
    onSubmit(parsed.data);
  };

  const message = error ?? serverError ?? null;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pc-sku">สินค้า</Label>
        <SKUSelect
          id="pc-sku"
          value={form.erpSkuId ? String(form.erpSkuId) : ""}
          current={{
            id: form.erpSkuId ? String(form.erpSkuId) : "",
            code: form.skuCode,
            name: form.skuName,
          }}
          disabled={readOnly}
          onPick={(s) =>
            setForm((f) => ({
              ...f,
              erpSkuId: s.id,
              skuCode: s.code,
              skuName: s.name,
              skuPrice: s.price,
            }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pc-qty">จำนวนรหัส</Label>
        <Input
          id="pc-qty"
          type="number"
          min={1}
          max={100000}
          disabled={readOnly}
          value={form.quantity}
          onChange={(e) => set("quantity", Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pc-points">แต้มต่อรหัส</Label>
        <Input
          id="pc-points"
          type="number"
          min={1}
          disabled={readOnly}
          value={form.pointsPerCode}
          onChange={(e) => set("pointsPerCode", Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pc-lot">เลขล็อตสินค้า</Label>
        <Input
          id="pc-lot"
          maxLength={100}
          disabled={readOnly}
          placeholder="ตามที่พิมพ์บนบรรจุภัณฑ์"
          value={form.lotNumber}
          onChange={(e) => set("lotNumber", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pc-lot-exp">วันหมดอายุสินค้า</Label>
        <ThaiDateInput
          id="pc-lot-exp"
          kind="date"
          disabled={readOnly}
          value={form.lotExpiryDate}
          onChange={(v) => set("lotExpiryDate", v)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pc-code-exp">รหัสใช้ได้ถึง</Label>
        <ThaiDateInput
          id="pc-code-exp"
          kind="date"
          disabled={readOnly}
          value={form.codeExpiresAt}
          onChange={(v) => set("codeExpiresAt", v)}
        />
      </div>

      <div className="flex items-end pb-1">
        <label
          className="flex h-9 items-center gap-2 text-sm"
          title="ใช้ได้เฉพาะสมาชิกผู้ทดสอบ ไม่ต้องระบุล็อตสินค้า"
        >
          <input
            type="checkbox"
            disabled={readOnly}
            checked={form.isTest}
            onChange={(e) => set("isTest", e.target.checked)}
          />
          ล็อตทดสอบ
          <span className="text-xs text-neutral-500">
            (ไม่ต้องระบุล็อตสินค้า)
          </span>
        </label>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="pc-note">หมายเหตุ</Label>
        <Input
          id="pc-note"
          maxLength={500}
          disabled={readOnly}
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
        />
      </div>

      {message && (
        <p role="alert" className="sm:col-span-2 text-xs text-red-600">
          {message}
        </p>
      )}

      {!readOnly && (
        <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 border-t border-neutral-100 pt-4">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "outline" })}
          >
            ยกเลิก
          </Link>
          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-40"
            disabled={isPending}
          >
            {isPending ? "กำลังบันทึก…" : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

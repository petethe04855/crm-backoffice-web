"use client";

import { useState, type FormEvent } from "react";
import { ThaiDateInput } from "@/components/form/ThaiDateInput";
import Link from "next/link";
import { Download, Power, Search, Settings2, XCircle } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { Pagination } from "@/components/common/Pagination";
import { SearchPanel } from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { SKUSelect } from "@/features/rewards/components/RewardForm";
import { formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import {
  useActivateBatch,
  useCreateBatch,
  useExportBatch,
  useProductCodeBatches,
  useVoidBatch,
} from "../hooks/useProductCodes";
import {
  EMPTY_BATCH_FORM,
  batchFormSchema,
  type BatchFormValues,
} from "../schemas/batchForm";
import {
  BATCH_STATUS_LABEL,
  BATCH_STATUS_VARIANT,
  type BatchFilters,
  type BatchStatus,
  type ExportFormat,
  type ProductCodeBatch,
} from "../types/productCode";

const num = new Intl.NumberFormat("th-TH");

/**
 * Packaging-code batches: create a draft, export the print file once (the full
 * codes are generated then and never stored), activate, or void.
 */
export function ProductCodeBatchesView() {
  const session = useAuthStore((s) => s.session);
  const canExport = hasPermission(session, PERMISSIONS.productCodesExport);
  const [filters, setFilters] = useState<BatchFilters>({
    search: "",
    status: "",
    page: 1,
  });
  const [searchText, setSearchText] = useState("");
  const list = useProductCodeBatches(filters);
  const exportBatch = useExportBatch();
  const activate = useActivateBatch();
  const voidBatch = useVoidBatch();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const actionError = exportBatch.error ?? activate.error ?? voidBatch.error;

  const onExport = (b: ProductCodeBatch) => {
    const ok = window.confirm(
      `ส่งออกรหัส ${num.format(b.quantity)} รหัสของล็อต ${b.batchNo}?\n\nส่งออกได้ครั้งเดียว ระบบไม่เก็บรหัสเต็มไว้ ถ้าไฟล์หาย ต้องยกเลิกล็อตนี้แล้วสร้างใหม่`,
    );
    if (ok) exportBatch.mutate({ id: b.id, format });
  };

  const onVoid = (b: ProductCodeBatch) => {
    const reason = window.prompt(
      `เหตุผลที่ยกเลิกล็อต ${b.batchNo} (รหัสที่ยังไม่ถูกใช้จะใช้ไม่ได้ทันที)`,
    );
    if (reason && reason.trim())
      voidBatch.mutate({ id: b.id, reason: reason.trim() });
  };

  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.meta.total / list.data.meta.limit))
    : 1;

  return (
    <>
      <PageHeader
        title="รหัสสินค้า"
        description="สร้างล็อตรหัสสำหรับพิมพ์บนบรรจุภัณฑ์ สมาชิกกรอกรหัสใน LINE เพื่อรับแต้ม — ไฟล์รหัสส่งออกได้ครั้งเดียว"
      />
      <div className="mb-4 flex justify-end">
        <Link
          href="/product-codes/settings"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:underline"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
          ตั้งค่าการกรอกรหัส / ผู้ทดสอบ
        </Link>
      </div>
      <div className="mt-6">
        <SearchPanel title="ค้นหา">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setFilters((f) => ({ ...f, search: searchText, page: 1 }));
            }}
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400"
                aria-hidden
              />
              <Input
                aria-label="ค้นหาล็อต"
                className="pl-8"
                placeholder="เลขล็อต, รหัสหรือชื่อสินค้า"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <Select
              aria-label="สถานะ"
              className="sm:w-48"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as BatchStatus | "",
                  page: 1,
                }))
              }
            >
              <option value="">ทุกสถานะ</option>
              {(Object.keys(BATCH_STATUS_LABEL) as BatchStatus[]).map((s) => (
                <option key={s} value={s}>
                  {BATCH_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="outline" className="sm:min-w-32">
              ค้นหา
            </Button>
          </form>
        </SearchPanel>
      </div>
      <TwoColumnLayout
        sidebar={<CreateBatchForm />}
        content={
          <div className="space-y-3">
            {canExport && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <Label htmlFor="pc-format">ไฟล์ส่งออก</Label>
                <Select
                  id="pc-format"
                  className="w-28"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                >
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </Select>
              </div>
            )}
            {actionError && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
              >
                {actionError.message}
              </p>
            )}
            {list.isLoading ? (
              <Loading />
            ) : list.isError ? (
              <ErrorState
                message={list.error.message}
                onRetry={() => list.refetch()}
              />
            ) : (
              <section className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        ล็อต
                      </th>
                      <th className="px-4 py-3 text-left">สินค้า</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">
                        จำนวน / ใช้แล้ว
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">
                        แต้ม/รหัส
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        หมดอายุ
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        สถานะ
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(list.data?.data ?? []).map((b) => (
                      <tr key={b.id}>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="font-mono font-medium">{b.batchNo}</p>
                          <p className="text-xs text-neutral-500">
                            {b.lotNumber
                              ? `ล็อตสินค้า ${b.lotNumber}`
                              : "ยังไม่ระบุล็อตสินค้า"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{b.skuName}</p>
                          <p className="font-mono text-xs text-neutral-500">
                            {b.skuCode}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {num.format(b.quantity)}
                          <span className="text-neutral-500">
                            {" "}
                            / {num.format(b.stats.used)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {num.format(b.pointsPerCode)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {b.codeExpiresAt
                            ? formatThaiDateTime(b.codeExpiresAt)
                            : "ไม่หมดอายุ"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 space-x-1">
                          <Badge variant={BATCH_STATUS_VARIANT[b.status]}>
                            {BATCH_STATUS_LABEL[b.status]}
                          </Badge>
                          {b.isTest && <Badge variant="outline">ทดสอบ</Badge>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {b.status === "draft" && canExport && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={exportBatch.isPending}
                                onClick={() => onExport(b)}
                              >
                                <Download
                                  className="mr-1 h-3.5 w-3.5"
                                  aria-hidden
                                />
                                {exportBatch.isPending &&
                                exportBatch.variables?.id === b.id
                                  ? "กำลังสร้าง…"
                                  : "ส่งออก"}
                              </Button>
                            )}
                            {b.status === "draft" && !canExport && (
                              <span className="self-center text-xs text-neutral-500">
                                รอ owner ส่งออก
                              </span>
                            )}
                            {b.status === "exported" && (
                              <Button
                                size="sm"
                                disabled={activate.isPending}
                                onClick={() => activate.mutate(b.id)}
                              >
                                <Power
                                  className="mr-1 h-3.5 w-3.5"
                                  aria-hidden
                                />
                                เปิดใช้
                              </Button>
                            )}
                            {b.status !== "void" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={voidBatch.isPending}
                                onClick={() => onVoid(b)}
                              >
                                <XCircle
                                  className="mr-1 h-3.5 w-3.5"
                                  aria-hidden
                                />
                                ยกเลิก
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {list.data?.data.length === 0 && (
                  <p className="py-12 text-center text-sm text-neutral-500">
                    ยังไม่มีล็อตรหัสสินค้า
                  </p>
                )}
              </section>
            )}
            {list.data && totalPages > 1 && (
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                totalItems={list.data.meta.total}
                onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
              />
            )}
          </div>
        }
      />
    </>
  );
}

function CreateBatchForm() {
  const create = useCreateBatch();
  const [form, setForm] = useState<BatchFormValues>(EMPTY_BATCH_FORM);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof BatchFormValues>(
    key: K,
    value: BatchFormValues[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = batchFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูล");
      return;
    }
    if (!parsed.data.isTest && !parsed.data.lotNumber) {
      if (
        !window.confirm(
          "ยังไม่ระบุเลขล็อตสินค้า — เปิดใช้งานไม่ได้จนกว่าจะระบุ สร้างเป็นร่างไว้ก่อน?",
        )
      )
        return;
    }
    setError(null);
    create.mutate(parsed.data, { onSuccess: () => setForm(EMPTY_BATCH_FORM) });
  };

  const message = error ?? create.error?.message ?? null;

  return (
    <SearchPanel title="สร้างล็อตรหัสใหม่">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pc-sku">สินค้า</Label>
          <SKUSelect
            id="pc-sku"
            value={form.erpSkuId ? String(form.erpSkuId) : ""}
            current={{
              id: form.erpSkuId ? String(form.erpSkuId) : "",
              code: form.skuCode,
              name: form.skuName,
            }}
            disabled={false}
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
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="pc-qty">จำนวนรหัส</Label>
            <Input
              id="pc-qty"
              type="number"
              min={1}
              max={100000}
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
              value={form.pointsPerCode}
              onChange={(e) => set("pointsPerCode", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pc-lot">เลขล็อตสินค้า</Label>
          <Input
            id="pc-lot"
            maxLength={100}
            placeholder="ตามที่พิมพ์บนบรรจุภัณฑ์"
            value={form.lotNumber}
            onChange={(e) => set("lotNumber", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="pc-lot-exp">วันหมดอายุสินค้า</Label>
            <ThaiDateInput
              id="pc-lot-exp"
              kind="date"
              value={form.lotExpiryDate}
              onChange={(v) => set("lotExpiryDate", v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc-code-exp">รหัสใช้ได้ถึง</Label>
            <ThaiDateInput
              id="pc-code-exp"
              kind="date"
              value={form.codeExpiresAt}
              onChange={(v) => set("codeExpiresAt", v)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pc-note">หมายเหตุ</Label>
          <Input
            id="pc-note"
            maxLength={500}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.isTest}
            onChange={(e) => set("isTest", e.target.checked)}
          />
          <span>
            ล็อตทดสอบ
            <span className="block text-xs text-neutral-500">
              ใช้ได้เฉพาะสมาชิกผู้ทดสอบ ไม่ต้องระบุล็อตสินค้า
            </span>
          </span>
        </label>
        {message && (
          <p role="alert" className="text-xs text-red-600">
            {message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={create.isPending}>
          {create.isPending ? "กำลังสร้าง…" : "สร้างล็อต (ร่าง)"}
        </Button>
      </form>
    </SearchPanel>
  );
}

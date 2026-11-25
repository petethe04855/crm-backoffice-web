"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, Info, Power, XCircle } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { cn, formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import {
  useActivateBatch,
  useExportBatch,
  useProductCodeBatch,
  useUpdateBatch,
  useVoidBatch,
} from "../hooks/useProductCodes";
import type { BatchFormValues } from "../schemas/batchForm";
import {
  BATCH_STATUS_LABEL,
  BATCH_STATUS_VARIANT,
  type ExportFormat,
  type ProductCodeBatch,
} from "../types/productCode";
import { BatchForm } from "./BatchForm";

type TabKey = "details" | "excel";

const num = new Intl.NumberFormat("th-TH");
const bkkYmd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });

function toDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : bkkYmd.format(d);
}

function toFormValues(b: ProductCodeBatch): BatchFormValues {
  return {
    erpSkuId: b.erpSkuId,
    skuCode: b.skuCode,
    skuName: b.skuName,
    skuPrice: b.skuPrice,
    quantity: b.quantity,
    pointsPerCode: b.pointsPerCode,
    lotNumber: b.lotNumber ?? "",
    lotExpiryDate: toDateInput(b.lotExpiryDate),
    codeExpiresAt: toDateInput(b.codeExpiresAt),
    isTest: b.isTest,
    note: b.note ?? "",
  };
}

const EXCEL_HEADERS = [
  { col: "A", label: "ลำดับ" },
  { col: "B", label: "รหัส" },
  { col: "C", label: "ล็อตรหัส" },
  { col: "D", label: "รหัสสินค้า" },
  { col: "E", label: "ชื่อสินค้า" },
  { col: "F", label: "เลขล็อตสินค้า" },
  { col: "G", label: "แต้มต่อรหัส" },
  { col: "H", label: "หมดอายุ" },
] as const;

/** Detail / edit page for a single product-code batch, plus an Excel-format preview tab. */
export function BatchDetailView({ id }: { id: number }) {
  const session = useAuthStore((s) => s.session);
  const canExport = hasPermission(session, PERMISSIONS.productCodesExport);
  const { data: batch, isLoading, isError, error, refetch } = useProductCodeBatch(id);
  const update = useUpdateBatch(id);
  const exportBatch = useExportBatch();
  const activate = useActivateBatch();
  const voidBatch = useVoidBatch();

  const [tab, setTab] = useState<TabKey>("details");
  const [saved, setSaved] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("xlsx");

  const back = (
    <Link href="/product-codes" className={buttonVariants({ variant: "outline" })}>
      <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
      กลับไปล็อตรหัส
    </Link>
  );

  if (isLoading) return <Loading message="กำลังโหลดข้อมูลล็อตรหัส…" />;
  if (isError || !batch) {
    return (
      <>
        <PageHeader title="รายละเอียดล็อตรหัส" actions={back} />
        <ErrorState
          title="โหลดข้อมูลไม่สำเร็จ"
          message={error?.message ?? "ไม่พบล็อตรหัสสินค้า"}
          onRetry={() => refetch()}
        />
      </>
    );
  }

  const isDraft = batch.status === "draft";
  const actionError = exportBatch.error ?? activate.error ?? voidBatch.error;

  const onExport = () => {
    const ok = window.confirm(
      `ส่งออกรหัส ${num.format(batch.quantity)} รหัสของล็อต ${batch.batchNo}?\n\nส่งออกได้ครั้งเดียว ระบบไม่เก็บรหัสเต็มไว้ ถ้าไฟล์หาย ต้องยกเลิกล็อตนี้แล้วสร้างใหม่`,
    );
    if (ok) exportBatch.mutate({ id: batch.id, format });
  };

  const onVoid = () => {
    const reason = window.prompt(
      `เหตุผลที่ยกเลิกล็อต ${batch.batchNo} (รหัสที่ยังไม่ถูกใช้จะใช้ไม่ได้ทันที)`,
    );
    if (reason && reason.trim()) {
      voidBatch.mutate({ id: batch.id, reason: reason.trim() });
    }
  };

  return (
    <>
      <PageHeader
        title={batch.batchNo}
        description={`${batch.skuName} (${batch.skuCode}) · สร้างเมื่อ ${formatThaiDateTime(batch.createdAt)}`}
        actions={
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {back}
            {isDraft && canExport && (
              <Button
                variant="outline"
                disabled={exportBatch.isPending}
                onClick={onExport}
              >
                <Download className="mr-1.5 h-4 w-4" aria-hidden />
                {exportBatch.isPending ? "กำลังสร้าง…" : "ส่งออกไฟล์พิมพ์"}
              </Button>
            )}
            {batch.status === "exported" && (
              <Button
                disabled={activate.isPending}
                onClick={() => activate.mutate(batch.id)}
              >
                <Power className="mr-1.5 h-4 w-4" aria-hidden />
                เปิดใช้งานล็อต
              </Button>
            )}
            {batch.status !== "void" && (
              <Button
                variant="destructive"
                disabled={voidBatch.isPending}
                onClick={onVoid}
              >
                <XCircle className="mr-1.5 h-4 w-4" aria-hidden />
                ยกเลิกล็อต
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={BATCH_STATUS_VARIANT[batch.status]}>
          {BATCH_STATUS_LABEL[batch.status]}
        </Badge>
        {batch.isTest && <Badge variant="outline">ล็อตทดสอบ</Badge>}
        <span className="text-neutral-500">
          ใช้แล้ว {num.format(batch.stats.used)} / {num.format(batch.quantity)} รหัส
        </span>
        {batch.voidReason && (
          <span className="text-red-600">· เหตุผลยกเลิก: {batch.voidReason}</span>
        )}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {actionError.message}
        </p>
      )}

      <div
        role="tablist"
        aria-label="รายละเอียดล็อตรหัส"
        className="mb-5 flex gap-1 overflow-x-auto border-b border-neutral-200"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "details"}
          onClick={() => setTab("details")}
          className={cn(
            "whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors",
            tab === "details"
              ? "border-neutral-900 font-medium text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-800",
          )}
        >
          {isDraft ? "แก้ไขข้อมูลล็อต" : "ข้อมูลล็อต"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "excel"}
          onClick={() => setTab("excel")}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors",
            tab === "excel"
              ? "border-neutral-900 font-medium text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-800",
          )}
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          ข้อมูลรหัสในล็อต
        </button>
      </div>

      <div role="tabpanel">
        {tab === "details" ? (
          <section className="max-w-3xl space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            {!isDraft && (
              <div className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                <p>
                  ล็อตนี้อยู่ในสถานะ <strong>{BATCH_STATUS_LABEL[batch.status]}</strong>{" "}
                  จึงไม่สามารถแก้ไขข้อมูลได้ (แก้ไขได้เฉพาะล็อตสถานะ “ร่าง” ก่อนส่งออกไฟล์)
                </p>
              </div>
            )}
            {saved && (
              <p
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-700"
              >
                บันทึกการแก้ไขล็อต {batch.batchNo} เรียบร้อยแล้ว
              </p>
            )}
            <BatchForm
              key={`${batch.id}-${batch.status}-${batch.quantity}-${batch.pointsPerCode}-${batch.lotNumber}`}
              initialValues={toFormValues(batch)}
              submitLabel="บันทึกการแก้ไข"
              isPending={update.isPending}
              serverError={update.error?.message}
              readOnly={!isDraft}
              onSubmit={(values) => {
                setSaved(false);
                update.mutate(values, {
                  onSuccess: () => setSaved(true),
                });
              }}
            />
          </section>
        ) : (
          <ExcelPreviewTab
            batch={batch}
            format={format}
            setFormat={setFormat}
            canExport={canExport}
            isExporting={exportBatch.isPending}
            onExport={onExport}
          />
        )}
      </div>
    </>
  );
}

function ExcelPreviewTab({
  batch,
  format,
  setFormat,
  canExport,
  isExporting,
  onExport,
}: {
  batch: ProductCodeBatch;
  format: ExportFormat;
  setFormat: (f: ExportFormat) => void;
  canExport: boolean;
  isExporting: boolean;
  onExport: () => void;
}) {
  const isDraft = batch.status === "draft";
  const expires = toDateInput(batch.codeExpiresAt);
  const previewCount = Math.min(batch.quantity, 10);
  const sampleCode = isDraft ? "XXXX-XXXX-XXXX" : "••••-••••-••••";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 shadow-sm">
        <div className="text-xs text-neutral-600">
          <p className="font-medium text-neutral-900">
            ข้อมูลรหัสสินค้าในล็อต {batch.batchNo}
          </p>
          <p className="mt-0.5 text-neutral-500">
            {isDraft
              ? `แสดงตัวอย่าง ${num.format(previewCount)} แถวแรกจากทั้งหมด ${num.format(batch.quantity)} แถว (รหัสจริงจะถูกสุ่มสร้างตอนกดส่งออก)`
              : `แสดง ${num.format(previewCount)} แถวแรกจากทั้งหมด ${num.format(batch.quantity)} แถว (ระบบไม่เก็บรหัสเต็มไว้หลังส่งออก — ใช้แล้ว ${num.format(batch.stats.used)} รหัส)`}
          </p>
        </div>
        {isDraft && canExport && (
          <div className="flex items-center gap-2">
            <Label htmlFor="pc-detail-format" className="text-xs text-neutral-600">
              รูปแบบไฟล์
            </Label>
            <Select
              id="pc-detail-format"
              className="h-8 w-24 text-xs"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
            </Select>
            <Button size="sm" variant="outline" disabled={isExporting} onClick={onExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {isExporting ? "กำลังสร้าง…" : "ส่งออก"}
            </Button>
          </div>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
          <span className="text-sm font-semibold text-neutral-800">
            รายการรหัสในล็อต
          </span>
          <span className="text-xs text-neutral-500">
            {num.format(batch.quantity)} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200/80 bg-neutral-50/80">
              <tr>
                {EXCEL_HEADERS.map((h) => (
                  <th
                    key={h.col}
                    className={cn(
                      "whitespace-nowrap px-5 py-3 text-xs font-semibold text-neutral-600",
                      h.col === "A" || h.col === "G" ? "text-right" : "text-left",
                    )}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {Array.from({ length: previewCount }, (_, i) => (
                <tr key={i} className="transition-colors hover:bg-neutral-50/70">
                  <td className="whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-neutral-500">
                    {i + 1}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-neutral-500">
                    {sampleCode}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-neutral-800">
                    {batch.batchNo}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-neutral-700">
                    {batch.skuCode}
                  </td>
                  <td className="min-w-44 px-5 py-3.5 text-neutral-900">
                    {batch.skuName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-neutral-700">
                    {batch.lotNumber || "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right font-medium tabular-nums text-neutral-900">
                    {num.format(batch.pointsPerCode)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-neutral-600">
                    {expires || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {batch.quantity > previewCount && (
          <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-3 text-center text-xs text-neutral-500">
            อีก {num.format(batch.quantity - previewCount)} แถว (รวมทั้งหมด{" "}
            {num.format(batch.quantity)} รหัส)
          </div>
        )}
      </section>
    </div>
  );
}

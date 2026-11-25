"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Plus, Power, Search, Settings2, XCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import {
  SEARCH_FORM_GRID,
  SEARCH_FORM_SUBMIT,
  SearchPanel,
} from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import {
  useActivateBatch,
  useExportBatch,
  useProductCodeBatches,
  useVoidBatch,
} from "../hooks/useProductCodes";
import {
  BATCH_STATUS_LABEL,
  BATCH_STATUS_VARIANT,
  type BatchFilters,
  type BatchStatus,
  type ExportFormat,
  type ProductCodeBatch,
} from "../types/productCode";

const num = new Intl.NumberFormat("th-TH");
const EMPTY_FILTERS: BatchFilters = { search: "", status: "", page: 1 };

const columns: Column<ProductCodeBatch>[] = [
  {
    key: "batchNo",
    label: "ล็อต",
    render: (b) => (
      <div>
        <Link
          href={`/product-codes/${b.id}`}
          className="font-mono font-medium text-neutral-900 hover:underline"
        >
          {b.batchNo}
        </Link>
        <p className="text-xs text-neutral-500">
          {b.lotNumber ? `ล็อตสินค้า ${b.lotNumber}` : "ยังไม่ระบุล็อตสินค้า"}
        </p>
      </div>
    ),
  },
  {
    key: "skuName",
    label: "สินค้า",
    render: (b) => (
      <div>
        <p className="font-medium text-neutral-900">{b.skuName}</p>
        <p className="font-mono text-xs text-neutral-500">{b.skuCode}</p>
      </div>
    ),
  },
  {
    key: "quantity",
    label: "จำนวน / ใช้แล้ว",
    money: true,
    render: (b) => (
      <span>
        {num.format(b.quantity)}
        <span className="font-normal text-neutral-500">
          {" "}
          / {num.format(b.stats.used)}
        </span>
      </span>
    ),
  },
  {
    key: "pointsPerCode",
    label: "แต้ม/รหัส",
    money: true,
    render: (b) => num.format(b.pointsPerCode),
  },
  {
    key: "codeExpiresAt",
    label: "หมดอายุ",
    render: (b) =>
      b.codeExpiresAt ? formatThaiDateTime(b.codeExpiresAt) : "ไม่หมดอายุ",
  },
  {
    key: "status",
    label: "สถานะ",
    render: (b) => (
      <div className="flex items-center gap-1">
        <Badge variant={BATCH_STATUS_VARIANT[b.status]}>
          {BATCH_STATUS_LABEL[b.status]}
        </Badge>
        {b.isTest && <Badge variant="outline">ทดสอบ</Badge>}
      </div>
    ),
  },
];

/**
 * Packaging-code batches: list, search, export print file once, activate, or void.
 */
export function ProductCodeBatchesView() {
  const session = useAuthStore((s) => s.session);
  const canExport = hasPermission(session, PERMISSIONS.productCodesExport);
  const [filters, setFilters] = useState<BatchFilters>(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState("");
  const list = useProductCodeBatches(filters);
  const exportBatch = useExportBatch();
  const activate = useActivateBatch();
  const voidBatch = useVoidBatch();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const actionError = exportBatch.error ?? activate.error ?? voidBatch.error;

  const activeFilterCount = [filters.search.trim(), filters.status].filter(
    Boolean,
  ).length;

  const resetFilters = () => {
    setSearchText("");
    setFilters(EMPTY_FILTERS);
  };

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

  return (
    <>
      <PageHeader
        title="รหัสสินค้า"
        description="สร้างล็อตรหัสสำหรับพิมพ์บนบรรจุภัณฑ์ สมาชิกกรอกรหัสใน LINE เพื่อรับแต้ม — ไฟล์รหัสส่งออกได้ครั้งเดียว"
        actions={
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/product-codes/settings"
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings2 className="mr-1.5 h-4 w-4" aria-hidden />
              ตั้งค่าการกรอกรหัส / ผู้ทดสอบ
            </Link>
            <Link href="/product-codes/new" className={buttonVariants()}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              สร้างล็อตรหัสใหม่
            </Link>
          </div>
        }
      />

      <TwoColumnLayout
        filtersOnTop
        sidebar={
          <SearchPanel
            title="ค้นหาล็อตรหัส"
            onReset={resetFilters}
            activeFilterCount={activeFilterCount}
          >
            <form
              className={SEARCH_FORM_GRID}
              onSubmit={(e) => {
                e.preventDefault();
                setFilters((f) => ({ ...f, search: searchText, page: 1 }));
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="pc-search">คำค้นหา</Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400"
                    aria-hidden
                  />
                  <Input
                    id="pc-search"
                    className="pl-8"
                    placeholder="เลขล็อต, รหัสหรือชื่อสินค้า"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:max-w-52">
                <Label htmlFor="pc-status">สถานะ</Label>
                <Select
                  id="pc-status"
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
              </div>
              <Button
                type="submit"
                variant="outline"
                className={SEARCH_FORM_SUBMIT}
              >
                ค้นหา
              </Button>
            </form>
          </SearchPanel>
        }
        content={
          <div className="space-y-3">
            {canExport && (
              <div className="flex items-center justify-end gap-2">
                <Label
                  htmlFor="pc-format"
                  className="whitespace-nowrap text-xs text-neutral-600"
                >
                  ไฟล์ส่งออก
                </Label>
                <Select
                  id="pc-format"
                  className="h-8 w-24 text-xs"
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
            <DataTable
              rows={list.data?.data ?? []}
              columns={columns}
              meta={
                list.data?.meta ?? {
                  page: filters.page,
                  limit: 20,
                  total: 0,
                  totalPages: 1,
                }
              }
              isLoading={list.isLoading}
              isError={list.isError}
              onRetry={() => list.refetch()}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
              actions={(b) => (
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/product-codes/${b.id}`}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    {b.status === "draft" ? (
                      <>
                        <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                        แก้ไข
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-3.5 w-3.5" aria-hidden />
                        ดูข้อมูล
                      </>
                    )}
                  </Link>
                  {b.status === "draft" && canExport && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={exportBatch.isPending}
                      onClick={() => onExport(b)}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" aria-hidden />
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
                      <Power className="mr-1 h-3.5 w-3.5" aria-hidden />
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
                      <XCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
                      ยกเลิก
                    </Button>
                  )}
                </div>
              )}
            />
          </div>
        }
      />
    </>
  );
}

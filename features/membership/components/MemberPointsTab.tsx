"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatThaiDateTime } from "@/lib/utils";
import { useMemberLedger } from "../hooks/useMemberManagement";
import type { LedgerType, PointLedgerEntry } from "../types/member";
import { LEDGER_TYPE_LABEL } from "../types/member";
import { PointsAdjustDialog } from "./PointsAdjustDialog";

const columns: Column<PointLedgerEntry>[] = [
  { key: "createdAt", label: "วันที่", render: (e) => formatThaiDateTime(e.createdAt) },
  { key: "type", label: "ประเภท", render: (e) => LEDGER_TYPE_LABEL[e.type] ?? e.type },
  {
    key: "points",
    label: "แต้ม",
    render: (e) => (
      <span className={e.points >= 0 ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
        {e.points > 0 ? "+" : ""}
        {e.points.toLocaleString("th-TH")}
      </span>
    ),
  },
  { key: "balanceAfter", label: "คงเหลือ", render: (e) => e.balanceAfter.toLocaleString("th-TH") },
  { key: "note", label: "หมายเหตุ" },
  { key: "createdByEmail", label: "ผู้ทำรายการ" },
];

/** Point balance, statement and the manual adjustment entry point. */
export function MemberPointsTab({
  memberId,
  balance,
  canAdjust,
}: {
  memberId: number;
  balance: number;
  canAdjust: boolean;
}) {
  const [type, setType] = useState<"" | LedgerType>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const ledger = useMemberLedger(memberId, { type, page, limit });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-neutral-500">แต้มคงเหลือ</p>
          <p className="text-2xl font-semibold text-neutral-900">{balance.toLocaleString("th-TH")}</p>
          <p className="mt-1 text-xs text-neutral-500">แต้มหมดอายุ (FIFO) จะแสดงในส่วนกติกาแต้ม</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="กรองประเภทแต้ม"
            value={type}
            onChange={(e) => {
              setType(e.target.value as "" | LedgerType);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">ทุกประเภท</option>
            {Object.entries(LEDGER_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          {canAdjust && (
            <Button onClick={() => setAdjustOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              ปรับแต้ม
            </Button>
          )}
        </div>
      </div>

      <DataTable
        rows={ledger.data?.data ?? []}
        columns={columns}
        meta={ledger.data?.meta ?? { page, limit, total: 0 }}
        isLoading={ledger.isLoading}
        isError={ledger.isError}
        onRetry={() => ledger.refetch()}
        onPageChange={setPage}
        onLimitChange={(next) => {
          setLimit(next);
          setPage(1);
        }}
      />

      <PointsAdjustDialog
        memberId={memberId}
        balance={balance}
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
      />
    </div>
  );
}

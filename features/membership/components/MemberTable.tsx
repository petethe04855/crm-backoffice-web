"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { formatThaiDateTime } from "@/lib/utils";
import type { ApiListResponse } from "@/types/api";
import { maskEmail, maskPhone } from "../lib/mask";
import type { MemberListItem } from "../types/member";
import { MemberStatusBadge } from "./MemberStatusBadge";

function RevealCell({
  value,
  masked,
  revealed,
  onToggle,
  label,
}: {
  value: string;
  masked: string;
  revealed: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span>{revealed ? value : masked}</span>
      <button
        type="button"
        onClick={onToggle}
        className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        aria-label={revealed ? `ซ่อน${label}` : `แสดง${label}`}
        title={revealed ? `ซ่อน${label}` : `แสดง${label}`}
      >
        {revealed ? (
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </div>
  );
}

/** Column 2 of the member page. */
export function MemberTable({
  data,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onLimitChange,
}: {
  data: ApiListResponse<MemberListItem> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const toggle = useCallback(
    (key: string) =>
      setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] })),
    [],
  );

  const columns = useMemo<Column<MemberListItem>[]>(
    () => [
      {
        key: "memberCode",
        label: "รหัสสมาชิก",
        render: (m) => (
          <Link href={`/members/${m.id}`} className="font-mono font-medium text-neutral-900 hover:underline">
            {m.memberCode}
          </Link>
        ),
      },
      { key: "firstName", label: "ชื่อ-นามสกุล", render: (m) => `${m.firstName} ${m.lastName}` },
      {
        key: "email",
        label: "อีเมล",
        render: (m) =>
          m.email ? (
            <RevealCell
              value={m.email}
              masked={maskEmail(m.email)}
              revealed={!!revealedKeys[`${m.id}:email`]}
              onToggle={() => toggle(`${m.id}:email`)}
              label="อีเมล"
            />
          ) : (
            "—"
          ),
      },
      {
        key: "phone",
        label: "เบอร์โทร",
        render: (m) =>
          m.phone ? (
            <RevealCell
              value={m.phone}
              masked={maskPhone(m.phone)}
              revealed={!!revealedKeys[`${m.id}:phone`]}
              onToggle={() => toggle(`${m.id}:phone`)}
              label="เบอร์โทร"
            />
          ) : (
            "—"
          ),
      },
      { key: "tierName", label: "ระดับ" },
      { key: "pointBalance", label: "แต้ม", render: (m) => m.pointBalance.toLocaleString("th-TH") },
      { key: "lifetimeSpend", label: "ยอดซื้อสะสม", money: true },
      { key: "status", label: "สถานะ", render: (m) => <MemberStatusBadge status={m.status} /> },
      {
        key: "lastActiveAt",
        label: "ใช้งานล่าสุด",
        render: (m) => (m.lastActiveAt ? formatThaiDateTime(m.lastActiveAt, { includeTime: false }) : "—"),
      },
      { key: "registeredAt", label: "วันที่สมัคร", render: (m) => formatThaiDateTime(m.registeredAt, { includeTime: false }) },
    ],
    [revealedKeys, toggle],
  );

  return (
    <DataTable
      rows={data?.data ?? []}
      columns={columns}
      meta={data?.meta ?? { page: 1, limit: 20, total: 0 }}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
    />
  );
}

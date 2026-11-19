"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { SearchPanel } from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { useCouponList } from "../hooks/useCoupons";
import { describeBenefit, describeExpiry, describeQuota } from "../lib/benefit";
import {
  CHANNEL_LABEL,
  COUPON_STATUS_LABEL,
  EMPTY_COUPON_FILTERS,
  STATUS_VARIANT,
  type Coupon,
  type CouponFilters,
} from "../types/coupon";

type Draft = Pick<CouponFilters, "search" | "month" | "status" | "channel">;

const toDraft = (f: CouponFilters): Draft => ({ search: f.search, month: f.month, status: f.status, channel: f.channel });

export function countCouponFilters(f: Draft): number {
  return [f.search.trim(), f.month, f.status, f.channel].filter(Boolean).length;
}

function CouponSearchPanel({ filters, onApply }: { filters: CouponFilters; onApply: (d: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };
  const reset = () => {
    const empty = toDraft(EMPTY_COUPON_FILTERS);
    setDraft(empty);
    onApply(empty);
  };
  return (
    <SearchPanel onReset={reset} activeFilterCount={countCouponFilters(toDraft(filters))}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="c-search">ชื่อคูปอง</Label>
          <Input id="c-search" value={draft.search} onChange={(e) => set("search", e.target.value)} placeholder="ค้นหาจากชื่อ" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-month">เปิดให้แลกในเดือน</Label>
          <Input id="c-month" type="month" value={draft.month} onChange={(e) => set("month", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-status">สถานะ</Label>
          <Select id="c-status" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
            <option value="">ทั้งหมด</option>
            {Object.entries(COUPON_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-channel">ช่องทาง</Label>
          <Select id="c-channel" value={draft.channel} onChange={(e) => set("channel", e.target.value as Draft["channel"])}>
            <option value="">ทั้งหมด</option>
            {Object.entries(CHANNEL_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full">
          ค้นหา
        </Button>
      </form>
    </SearchPanel>
  );
}

const columns: Column<Coupon>[] = [
  {
    key: "name",
    label: "ชื่อ",
    render: (c) => (
      <Link href={`/coupons/${c.id}`} className="font-medium text-neutral-900 hover:underline">
        {c.name}
      </Link>
    ),
  },
  { key: "benefitType", label: "สิทธิ์", render: (c) => describeBenefit(c) },
  {
    key: "pointsCost",
    label: "แต้มที่ใช้แลก",
    render: (c) => (c.pointsCost > 0 ? c.pointsCost.toLocaleString("th-TH") : "แจกฟรี"),
  },
  { key: "expiryMode", label: "วันหมดอายุ", render: (c) => describeExpiry(c) },
  { key: "claimedCount", label: "แลกไป / โควตา", render: (c) => describeQuota(c) },
  { key: "usedCount", label: "ใช้จริง", render: (c) => c.usedCount.toLocaleString("th-TH") },
  { key: "channel", label: "ช่องทาง", render: (c) => CHANNEL_LABEL[c.channel] },
  {
    key: "status",
    label: "สถานะ",
    render: (c) => <Badge variant={STATUS_VARIANT[c.status]}>{COUPON_STATUS_LABEL[c.status]}</Badge>,
  },
];

/** /coupons — SearchPanel + table. */
export function CouponListView() {
  const [filters, setFilters] = useState<CouponFilters>(EMPTY_COUPON_FILTERS);
  const list = useCouponList(filters);
  const session = useAuthStore((s) => s.session);
  const canManage = hasPermission(session, PERMISSIONS.couponsManage);
  const canUse = hasPermission(session, PERMISSIONS.couponsUse);

  return (
    <>
      <PageHeader
        title="คูปอง"
        description="คูปองที่สมาชิกใช้แต้มแลก พร้อมวันหมดอายุและโควตา"
        actions={
          <div className="flex flex-wrap gap-2">
            {canUse && (
              <Link href="/coupons/redeem" className={buttonVariants({ variant: "outline" })}>
                <ScanLine className="mr-1 h-4 w-4" aria-hidden="true" />
                กดใช้คูปอง
              </Link>
            )}
            {canManage && (
              <Link href="/coupons/new" className={buttonVariants()}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                สร้างคูปอง
              </Link>
            )}
          </div>
        }
      />
      <TwoColumnLayout
        sidebar={<CouponSearchPanel filters={filters} onApply={(d) => setFilters((f) => ({ ...f, ...d, page: 1 }))} />}
        content={
          <DataTable
            rows={list.data?.data ?? []}
            columns={columns}
            meta={list.data?.meta ?? { page: filters.page, limit: filters.limit, total: 0 }}
            isLoading={list.isLoading}
            isError={list.isError}
            onRetry={() => list.refetch()}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            onLimitChange={(limit) => setFilters((f) => ({ ...f, limit, page: 1 }))}
          />
        }
      />
    </>
  );
}

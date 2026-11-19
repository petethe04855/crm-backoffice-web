"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatThaiDateTime } from "@/lib/utils";
import type { HolderQuery } from "../api/couponsApi";
import { useMemberCoupons } from "../hooks/useCoupons";
import { HOLDER_STATUS_LABEL, STATUS_VARIANT, type MemberCoupon } from "../types/coupon";
import { CancelCouponDialog } from "./CouponDetailView";

/** The coupons tab of /members/[id]. */
export function MemberCouponsTab({ memberId, canCancel }: { memberId: number; canCancel: boolean }) {
  const [q, setQ] = useState<HolderQuery>({ status: "", page: 1, limit: 20 });
  const list = useMemberCoupons(memberId, q);
  const [cancelling, setCancelling] = useState<MemberCoupon | null>(null);

  const columns: Column<MemberCoupon>[] = [
    {
      key: "couponName",
      label: "คูปอง",
      render: (h) => (
        <Link href={`/coupons/${h.couponId}`} className="font-medium hover:underline">
          {h.couponName}
        </Link>
      ),
    },
    { key: "code", label: "รหัส", render: (h) => <span className="font-mono">{h.sharedCode || h.code}</span> },
    { key: "pointsSpent", label: "แต้มที่ใช้", render: (h) => (h.pointsSpent ? h.pointsSpent.toLocaleString("th-TH") : "ฟรี") },
    { key: "claimedAt", label: "แลกเมื่อ", render: (h) => formatThaiDateTime(h.claimedAt) },
    { key: "expiresAt", label: "หมดอายุ", render: (h) => formatThaiDateTime(h.expiresAt) },
    { key: "status", label: "สถานะ", render: (h) => <Badge variant={STATUS_VARIANT[h.status]}>{HOLDER_STATUS_LABEL[h.status]}</Badge> },
  ];

  return (
    <>
      <DataTable
        rows={list.data?.data ?? []}
        columns={columns}
        meta={list.data?.meta ?? { page: q.page, limit: q.limit, total: 0 }}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => list.refetch()}
        onPageChange={(page) => setQ({ ...q, page })}
        onLimitChange={(limit) => setQ({ ...q, limit, page: 1 })}
        actions={
          canCancel
            ? (h) =>
                h.status === "available" ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCancelling(h)}>
                    ยกเลิก
                  </Button>
                ) : null
            : undefined
        }
      />
      <CancelCouponDialog holder={cancelling} onClose={() => setCancelling(null)} />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ErrorState } from "@/components/common/ErrorState";
import { ExportButton } from "@/components/common/ExportButton";
import { Loading } from "@/components/common/Loading";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { couponsApi, type HolderQuery } from "../api/couponsApi";
import { useCancelMemberCoupon, useCoupon, useCouponHolders, useCouponTransition, useDeleteCoupon } from "../hooks/useCoupons";
import { describeQuota } from "../lib/benefit";
import {
  COUPON_STATUS_LABEL,
  HOLDER_STATUS_LABEL,
  STATUS_VARIANT,
  type Coupon,
  type HolderStatus,
  type MemberCoupon,
} from "../types/coupon";
import { CouponForm } from "./CouponForm";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

/** Status buttons with a confirmation for the irreversible ones. */
function CouponActions({ coupon }: { coupon: Coupon }) {
  const router = useRouter();
  const transition = useCouponTransition();
  const remove = useDeleteCoupon();
  const [confirm, setConfirm] = useState<"end" | "delete" | null>(null);
  const error = transition.error ?? remove.error;

  const run = (action: "activate" | "pause" | "end") =>
    transition.mutate({ id: coupon.id, action }, { onSuccess: () => setConfirm(null) });

  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500">สถานะคูปอง</p>
      <div className="flex flex-wrap gap-2">
        {(coupon.status === "draft" || coupon.status === "paused") && (
          <Button type="button" onClick={() => run("activate")} disabled={transition.isPending}>
            {coupon.status === "draft" ? "เปิดให้แลก" : "เปิดอีกครั้ง"}
          </Button>
        )}
        {coupon.status === "active" && (
          <Button type="button" variant="outline" onClick={() => run("pause")} disabled={transition.isPending}>
            พักไว้
          </Button>
        )}
        {(coupon.status === "active" || coupon.status === "paused") && (
          <Button type="button" variant="outline" onClick={() => setConfirm("end")}>
            ปิดคูปอง
          </Button>
        )}
        {coupon.claimedCount === 0 && (
          <Button type="button" variant="destructive" onClick={() => setConfirm("delete")}>
            ลบ
          </Button>
        )}
      </div>
      {error && !confirm && (
        <p role="alert" className="text-sm text-red-600">
          {error.message}
        </p>
      )}
      <Modal
        open={confirm !== null}
        title={confirm === "end" ? "ปิดคูปองถาวร" : "ลบคูปอง"}
        description={
          confirm === "end"
            ? "ปิดแล้วสมาชิกแลกเพิ่มไม่ได้ และเปิดใหม่ไม่ได้ คูปองที่แลกไปแล้วยังใช้ได้จนหมดอายุ"
            : "ลบได้เพราะยังไม่มีใครแลก การลบย้อนกลับไม่ได้"
        }
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={transition.isPending || remove.isPending}
              onClick={() =>
                confirm === "end" ? run("end") : remove.mutate(coupon.id, { onSuccess: () => router.push("/coupons") })
              }
            >
              {confirm === "end" ? "ปิดคูปอง" : "ลบ"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-700">{coupon.name}</p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error.message}
          </p>
        )}
      </Modal>
    </div>
  );
}

export function CancelCouponDialog({ holder, onClose }: { holder: MemberCoupon | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const cancel = useCancelMemberCoupon();
  const tooShort = reason.trim().length < 3;
  const close = () => {
    setReason("");
    cancel.reset();
    onClose();
  };
  return (
    <Modal
      open={holder !== null}
      title="ยกเลิกคูปองของสมาชิก"
      description={
        holder && holder.pointsSpent > 0
          ? `คืน ${holder.pointsSpent.toLocaleString("th-TH")} แต้มให้สมาชิก และคืนโควตา 1 ใบ`
          : "คืนโควตา 1 ใบ (คูปองนี้ไม่ได้ใช้แต้มแลก)"
      }
      onClose={close}
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            ปิด
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={tooShort || cancel.isPending || !holder}
            onClick={() => holder && cancel.mutate({ id: holder.id, reason: reason.trim() }, { onSuccess: close })}
          >
            {cancel.isPending ? "กำลังยกเลิก…" : "ยืนยันยกเลิก"}
          </Button>
        </>
      }
    >
      {holder && (
        <p className="mb-3 text-sm text-neutral-700">
          {holder.code} · {holder.memberName || holder.memberCode}
        </p>
      )}
      <Label htmlFor="cancel-reason">เหตุผล (อย่างน้อย 3 ตัวอักษร)</Label>
      <Textarea id="cancel-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      {cancel.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {cancel.error.message}
        </p>
      )}
    </Modal>
  );
}

function HoldersSection({ coupon, canManage }: { coupon: Coupon; canManage: boolean }) {
  const [q, setQ] = useState<HolderQuery>({ status: "", page: 1, limit: 20 });
  const holders = useCouponHolders(coupon.id, q);
  const [cancelling, setCancelling] = useState<MemberCoupon | null>(null);

  const columns: Column<MemberCoupon>[] = [
    { key: "code", label: "รหัส", render: (h) => <span className="font-mono">{h.code}</span> },
    {
      key: "memberCode",
      label: "สมาชิก",
      render: (h) => (
        <Link href={`/members/${h.memberId}`} className="hover:underline">
          {h.memberName || h.memberCode}
        </Link>
      ),
    },
    { key: "claimedAt", label: "แลกเมื่อ", render: (h) => formatThaiDateTime(h.claimedAt) },
    { key: "expiresAt", label: "หมดอายุ", render: (h) => formatThaiDateTime(h.expiresAt) },
    { key: "status", label: "สถานะ", render: (h) => <Badge variant={STATUS_VARIANT[h.status]}>{HOLDER_STATUS_LABEL[h.status]}</Badge> },
    { key: "usedRef", label: "เลขบิล / เหตุผล", render: (h) => h.usedRef || h.cancelReason || "—" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="holder-status">ผู้ถือคูปอง</Label>
          <Select
            id="holder-status"
            value={q.status}
            onChange={(e) => setQ({ ...q, status: e.target.value as "" | HolderStatus, page: 1 })}
          >
            <option value="">ทุกสถานะ</option>
            {Object.entries(HOLDER_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <ExportButton label="ส่งออก Excel" onExport={() => couponsApi.exportHolders(coupon.id)} />
      </div>
      <DataTable
        rows={holders.data?.data ?? []}
        columns={columns}
        meta={holders.data?.meta ?? { page: q.page, limit: q.limit, total: 0 }}
        isLoading={holders.isLoading}
        isError={holders.isError}
        onRetry={() => holders.refetch()}
        onPageChange={(page) => setQ({ ...q, page })}
        onLimitChange={(limit) => setQ({ ...q, limit, page: 1 })}
        actions={
          canManage
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
    </section>
  );
}

/** /coupons/[id] — stats, status actions, the editable template and its holders. */
export function CouponDetailView({ id }: { id: number }) {
  const query = useCoupon(id);
  const canManage = hasPermission(useAuthStore((s) => s.session), PERMISSIONS.couponsManage);

  const back = (
    <Link href="/coupons" className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeft className="mr-1 h-4 w-4" />
      กลับไปหน้ารายการ
    </Link>
  );

  if (query.isLoading) return <Loading message="กำลังโหลดคูปอง…" />;
  if (query.isError || !query.data) {
    const notFound = (query.error as { status?: number } | null)?.status === 404;
    return (
      <>
        <PageHeader title="คูปอง" actions={back} />
        <ErrorState
          title={notFound ? "ไม่พบคูปอง" : "โหลดข้อมูลไม่สำเร็จ"}
          message={notFound ? "คูปองนี้อาจถูกลบไปแล้ว" : query.error?.message}
          onRetry={notFound ? undefined : () => query.refetch()}
        />
      </>
    );
  }

  const c = query.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={c.name}
        description={COUPON_STATUS_LABEL[c.status]}
        actions={back}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="แลกไป / โควตา" value={describeQuota(c)} />
        <Stat label="คงเหลือ" value={c.remainingQuota == null ? "ไม่จำกัด" : c.remainingQuota.toLocaleString("th-TH")} />
        <Stat label="ใช้จริง" value={c.usedCount.toLocaleString("th-TH")} />
        <Stat label="แต้มที่ใช้แลก" value={c.pointsCost > 0 ? c.pointsCost.toLocaleString("th-TH") : "แจกฟรี"} />
      </div>
      <CouponForm
        key={`${c.id}-${c.updatedAt}`}
        coupon={c}
        canManage={canManage}
        extraActions={canManage && c.status !== "ended" ? <CouponActions coupon={c} /> : undefined}
      />
      <HoldersSection coupon={c} canManage={canManage} />
    </div>
  );
}

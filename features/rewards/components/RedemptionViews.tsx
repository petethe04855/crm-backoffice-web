"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ErrorState } from "@/components/common/ErrorState";
import { ExportButton } from "@/components/common/ExportButton";
import { Loading } from "@/components/common/Loading";
import { SearchPanel } from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { rewardsApi } from "../api/rewardsApi";
import { useMemberRedemptions, useRedemptionList, useRedemptionTransition, useReward } from "../hooks/useRewards";
import {
  CANCELLABLE,
  EMPTY_REDEMPTION_FILTERS,
  NEXT_ACTION,
  REDEMPTION_STATUS_LABEL,
  STATUS_VARIANT,
  type Redemption,
  type RedemptionFilters,
} from "../types/reward";
import { RewardForm } from "./RewardForm";
import { RedemptionMemberView } from "@/features/line-oa/components/RedemptionMemberView";

/** Next-step and cancel buttons with the ship / cancel dialogs. */
export function RedemptionActions({ rd }: { rd: Redemption }) {
  const transition = useRedemptionTransition();
  const [dialog, setDialog] = useState<"ship" | "cancel" | null>(null);
  const [text, setText] = useState("");
  const next = NEXT_ACTION[rd.status];

  const close = () => {
    setDialog(null);
    setText("");
    transition.reset();
  };
  const confirm = () => {
    if (dialog === "ship") transition.mutate({ id: rd.id, action: "ship", body: { trackingNo: text.trim() } }, { onSuccess: close });
    if (dialog === "cancel") transition.mutate({ id: rd.id, action: "cancel", body: { reason: text.trim() } }, { onSuccess: close });
  };
  const invalid = dialog === "ship" ? !text.trim() : text.trim().length < 3;

  return (
    <div className="flex justify-end gap-1">
      {next && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={transition.isPending}
          onClick={() => (next.action === "ship" ? setDialog("ship") : transition.mutate({ id: rd.id, action: next.action }))}
        >
          {next.label}
        </Button>
      )}
      {CANCELLABLE.includes(rd.status) && (
        <Button type="button" size="sm" variant="ghost" onClick={() => setDialog("cancel")}>
          ยกเลิก
        </Button>
      )}
      {!dialog && transition.error && (
        <span role="alert" className="self-center text-xs text-red-600">
          {transition.error.message}
        </span>
      )}
      <Modal
        open={dialog !== null}
        title={dialog === "ship" ? `จัดส่ง ${rd.redemptionNo}` : `ยกเลิก ${rd.redemptionNo}`}
        description={
          dialog === "ship"
            ? "ระบบจะตัดสต็อกใน ERP ก่อน ถ้าสต็อกไม่พอรายการจะค้างที่ \"กำลังแพ็ก\""
            : `คืน ${rd.points.toLocaleString("th-TH")} แต้มให้สมาชิกและคืนโควตาของรางวัล`
        }
        onClose={close}
        footer={
          <>
            <Button type="button" variant="outline" onClick={close}>
              ปิด
            </Button>
            <Button
              type="button"
              variant={dialog === "cancel" ? "destructive" : "default"}
              disabled={invalid || transition.isPending}
              onClick={confirm}
            >
              {transition.isPending ? "กำลังบันทึก…" : dialog === "ship" ? "ยืนยันจัดส่ง" : "ยืนยันยกเลิก"}
            </Button>
          </>
        }
      >
        <Label htmlFor="rd-text">{dialog === "ship" ? "เลขพัสดุ" : "เหตุผล (อย่างน้อย 3 ตัวอักษร)"}</Label>
        {dialog === "ship" ? (
          <Input id="rd-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={100} />
        ) : (
          <Textarea id="rd-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        )}
        {dialog === "ship" && (
          <p className="mt-3 text-xs text-neutral-600">
            ส่งถึง {rd.shipName} {rd.shipPhone} · {rd.shipAddress} {rd.shipProvince} {rd.shipPostcode}
          </p>
        )}
        {transition.error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {transition.error.message}
          </p>
        )}
      </Modal>
    </div>
  );
}

const statusBadge = (rd: Redemption) => <Badge variant={STATUS_VARIANT[rd.status]}>{REDEMPTION_STATUS_LABEL[rd.status]}</Badge>;

const redemptionColumns: Column<Redemption>[] = [
  { key: "redemptionNo", label: "เลขที่", render: (r) => <span className="font-mono">{r.redemptionNo}</span> },
  { key: "createdAt", label: "วันที่แลก", render: (r) => formatThaiDateTime(r.createdAt) },
  {
    key: "memberCode",
    label: "สมาชิก",
    render: (r) => (
      <Link href={`/members/${r.memberId}`} className="hover:underline">
        {r.memberName || r.memberCode}
      </Link>
    ),
  },
  { key: "rewardName", label: "ของรางวัล" },
  { key: "points", label: "แต้ม", render: (r) => r.points.toLocaleString("th-TH") },
  { key: "shipProvince", label: "จังหวัด" },
  { key: "status", label: "สถานะ", render: statusBadge },
  { key: "trackingNo", label: "เลขพัสดุ / เหตุผล", render: (r) => r.trackingNo || r.cancelReason || "—" },
  {
    key: "lineMessages",
    label: "สมาชิกเห็นใน LINE OA",
    render: (r) => (
      <RedemptionMemberView status={r.status} trackingNo={r.trackingNo} cancelReason={r.cancelReason} lineMessages={r.lineMessages} />
    ),
  },
];

type Draft = Pick<RedemptionFilters, "search" | "status" | "dateFrom" | "dateTo">;
const toDraft = (f: RedemptionFilters): Draft => ({ search: f.search, status: f.status, dateFrom: f.dateFrom, dateTo: f.dateTo });

function RedemptionSearchPanel({ filters, onApply }: { filters: RedemptionFilters; onApply: (d: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };
  const reset = () => {
    const empty = toDraft(EMPTY_REDEMPTION_FILTERS);
    setDraft(empty);
    onApply(empty);
  };
  const dateError = draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo ? "วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด" : null;
  const active = [filters.search.trim(), filters.status, filters.dateFrom, filters.dateTo].filter(Boolean).length;
  return (
    <SearchPanel onReset={reset} activeFilterCount={active}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rd-search">เลขที่ / สมาชิก</Label>
          <Input id="rd-search" value={draft.search} onChange={(e) => set("search", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rd-status">สถานะ</Label>
          <Select id="rd-status" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
            <option value="">ทั้งหมด</option>
            {Object.entries(REDEMPTION_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="rd-from">ตั้งแต่</Label>
            <Input id="rd-from" type="date" value={draft.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rd-to">ถึง</Label>
            <Input id="rd-to" type="date" value={draft.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
          </div>
        </div>
        {dateError && (
          <p role="alert" className="text-xs text-red-600">
            {dateError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={Boolean(dateError)}>
          ค้นหา
        </Button>
      </form>
    </SearchPanel>
  );
}

/** /redemptions — the fulfilment queue. */
export function RedemptionListView() {
  const [filters, setFilters] = useState<RedemptionFilters>({ ...EMPTY_REDEMPTION_FILTERS, status: "pending" });
  const list = useRedemptionList(filters);
  return (
    <>
      <PageHeader
        title="การแลกรางวัล"
        description="รอตรวจ → อนุมัติ → แพ็ก → จัดส่ง (ตัดสต็อก ERP) → ได้รับ · ยกเลิกก่อนจัดส่งได้และคืนแต้ม"
        actions={<ExportButton label="ส่งออก Excel" onExport={() => rewardsApi.exportRedemptions(filters)} />}
      />
      <TwoColumnLayout
        sidebar={<RedemptionSearchPanel filters={filters} onApply={(d) => setFilters((f) => ({ ...f, ...d, page: 1 }))} />}
        content={
          <DataTable
            rows={list.data?.data ?? []}
            columns={redemptionColumns}
            meta={list.data?.meta ?? { page: filters.page, limit: filters.limit, total: 0 }}
            isLoading={list.isLoading}
            isError={list.isError}
            onRetry={() => list.refetch()}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            onLimitChange={(limit) => setFilters((f) => ({ ...f, limit, page: 1 }))}
            actions={(rd) => <RedemptionActions rd={rd} />}
          />
        }
      />
    </>
  );
}

/** The redemptions tab of /members/[id]. */
export function MemberRedemptionsTab({ memberId }: { memberId: number }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const list = useMemberRedemptions(memberId, page, limit);
  const canFulfill = hasPermission(useAuthStore((s) => s.session), PERMISSIONS.redemptionsFulfill);
  return (
    <DataTable
      rows={list.data?.data ?? []}
      columns={redemptionColumns.filter((c) => c.key !== "memberCode")}
      meta={list.data?.meta ?? { page, limit, total: 0 }}
      isLoading={list.isLoading}
      isError={list.isError}
      onRetry={() => list.refetch()}
      onPageChange={setPage}
      onLimitChange={(l) => {
        setLimit(l);
        setPage(1);
      }}
      actions={canFulfill ? (rd) => <RedemptionActions rd={rd} /> : undefined}
    />
  );
}

/** /rewards/[id]. */
export function RewardDetailView() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useReward(id);
  const canManage = hasPermission(useAuthStore((s) => s.session), PERMISSIONS.rewardsManage);
  if (query.isLoading) return <Loading message="กำลังโหลดของรางวัล…" />;
  if (query.isError || !query.data) {
    const notFound = (query.error as { status?: number } | null)?.status === 404;
    return (
      <ErrorState
        title={notFound ? "ไม่พบของรางวัล" : "โหลดข้อมูลไม่สำเร็จ"}
        message={notFound ? "ของรางวัลนี้อาจถูกลบหรือรหัสไม่ถูกต้อง" : query.error?.message}
        onRetry={notFound ? undefined : () => query.refetch()}
      />
    );
  }
  return <RewardForm key={`${query.data.id}-${query.data.updatedAt}`} reward={query.data} canManage={canManage} />;
}

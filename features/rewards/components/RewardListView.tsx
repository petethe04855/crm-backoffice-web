"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, ImagePlus, Plus, Tags, Truck, X } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { SearchPanel } from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { useCreateCategory, useDeleteCategory, useDeleteReward, useRewardCategories, useRewardList, useSetRewardStatus } from "../hooks/useRewards";
import { RowActions } from "@/components/common/RowActions";
import { showDisabledReason } from "@/features/line-oa/types/lineVisibility";
import { describeStock } from "../schemas/rewardForm";
import { EMPTY_REWARD_FILTERS, REWARD_STATUS_LABEL, STATUS_VARIANT, type Reward, type RewardFilters } from "../types/reward";
import { mediaUrl } from "@/lib/media";
import { LineVisibilityBadge } from "@/features/line-oa/components/LineVisibilityBadge";

type Draft = Pick<RewardFilters, "search" | "categoryId" | "status" | "lowStock">;
const toDraft = (f: RewardFilters): Draft => ({ search: f.search, categoryId: f.categoryId, status: f.status, lowStock: f.lowStock });

export function countRewardFilters(f: Draft): number {
  return [f.search.trim(), f.categoryId, f.status, f.lowStock ? "1" : ""].filter(Boolean).length;
}

function RewardSearchPanel({ filters, onApply }: { filters: RewardFilters; onApply: (d: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const categories = useRewardCategories();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };
  const reset = () => {
    const empty = toDraft(EMPTY_REWARD_FILTERS);
    setDraft(empty);
    onApply(empty);
  };
  return (
    <SearchPanel onReset={reset} activeFilterCount={countRewardFilters(toDraft(filters))}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="r-search">ชื่อ / รหัส SKU</Label>
          <Input id="r-search" value={draft.search} onChange={(e) => set("search", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-cat">หมวด</Label>
          <Select id="r-cat" value={draft.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">ทุกหมวด</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-status">สถานะ</Label>
          <Select id="r-status" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
            <option value="">ทั้งหมด</option>
            {Object.entries(REWARD_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.lowStock} onChange={(e) => set("lowStock", e.target.checked)} />
          สต็อกใกล้หมด (≤ 10)
        </label>
        <Button type="submit" className="w-full">
          ค้นหา
        </Button>
      </form>
    </SearchPanel>
  );
}

function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useRewardCategories();
  const create = useCreateCategory();
  const remove = useDeleteCategory();
  const [name, setName] = useState("");
  const error = create.error ?? remove.error;
  return (
    <Modal open={open} title="หมวดของรางวัล" onClose={onClose}>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate(name.trim(), { onSuccess: () => setName("") });
        }}
      >
        <Input aria-label="ชื่อหมวดใหม่" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อหมวดใหม่" />
        <Button type="submit" disabled={!name.trim() || create.isPending}>
          เพิ่ม
        </Button>
      </form>
      <ul className="divide-y divide-neutral-100">
        {(categories.data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            {c.name}
            <Button type="button" variant="ghost" size="sm" aria-label={`ลบหมวด ${c.name}`} onClick={() => remove.mutate(c.id)}>
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {categories.data?.length === 0 && <li className="py-2 text-sm text-neutral-500">ยังไม่มีหมวด</li>}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error.message}
        </p>
      )}
    </Modal>
  );
}

const columns: Column<Reward>[] = [
  {
    key: "imageUrl",
    label: "รูป",
    render: (r) =>
      r.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded files live on the API host
        <img src={mediaUrl(r.imageUrl)} alt="" className="h-10 w-10 rounded border border-neutral-200 object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-neutral-300 text-neutral-400">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
        </div>
      ),
  },
  {
    key: "name",
    label: "ชื่อ",
    render: (r) => <span className="font-medium text-neutral-900">{r.name}</span>,
  },
  { key: "skuCode", label: "SKU" },
  { key: "pointsCost", label: "แต้มที่ใช้แลก", render: (r) => r.pointsCost.toLocaleString("th-TH") },
  {
    key: "erpAvailableQty",
    label: "สต็อก ERP",
    render: (r) => (
      <span className="inline-flex items-center gap-1">
        {describeStock(r)}
        {r.stockStale && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-label="ข้อมูลสต็อกไม่อัปเดต" />}
      </span>
    ),
  },
  { key: "remainingQuota", label: "แลกได้อีก", render: (r) => r.remainingQuota.toLocaleString("th-TH") },
  { key: "redeemedCount", label: "แลกไปแล้ว", render: (r) => r.redeemedCount.toLocaleString("th-TH") },
  { key: "status", label: "สถานะ", render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{REWARD_STATUS_LABEL[r.status]}</Badge> },
  { key: "lineVisibility", label: "LINE OA", render: (r) => <LineVisibilityBadge value={r.lineVisibility} /> },
];


/** แสดงใน LINE OA (switch on) / แก้ไข / ลบ (never redeemed). */
function RewardRowActions({ r, canManage }: { r: Reward; canManage: boolean }) {
  const status = useSetRewardStatus();
  const remove = useDeleteReward();
  if (!canManage) return <RowActions editHref={`/rewards/${r.id}`} confirmDelete="" />;
  const switchable = r.status === "draft" || r.status === "inactive";
  return (
    <RowActions
      editHref={`/rewards/${r.id}`}
      show={{
        label: "แสดงใน LINE OA",
        run: () => status.mutateAsync({ id: r.id, status: "active" }),
        disabledReason: switchable ? undefined : showDisabledReason(r.lineVisibility) ?? "เปิดให้แลกอยู่แล้ว",
      }}
      remove={{
        label: "ลบ",
        run: () => remove.mutateAsync(r.id),
        disabledReason: r.redeemedCount === 0 ? undefined : "มีการแลกไปแล้ว ลบไม่ได้ — ใช้ \"เก็บถาวร\" ในหน้าแก้ไข",
      }}
      confirmDelete={`ลบของรางวัล "${r.name}"? การลบย้อนกลับไม่ได้`}
    />
  );
}

/** /rewards — SearchPanel + table. */
export function RewardListView() {
  const [filters, setFilters] = useState<RewardFilters>(EMPTY_REWARD_FILTERS);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const list = useRewardList(filters);
  const session = useAuthStore((s) => s.session);
  const canManage = hasPermission(session, PERMISSIONS.rewardsManage);
  const canFulfill = hasPermission(session, PERMISSIONS.redemptionsFulfill);

  return (
    <>
      <PageHeader
        title="ของรางวัล"
        description="สินค้าจาก ERP ที่สมาชิกใช้แต้มแลกได้ สต็อกอัปเดตจาก ERP ทุก 5 นาที"
        actions={
          <div className="flex flex-wrap gap-2">
            {canFulfill && (
              <Link href="/redemptions" className={buttonVariants({ variant: "outline" })}>
                <Truck className="mr-1 h-4 w-4" aria-hidden="true" />
                การแลกรางวัล
              </Link>
            )}
            {canManage && (
              <Button type="button" variant="outline" onClick={() => setCategoriesOpen(true)}>
                <Tags className="mr-1 h-4 w-4" aria-hidden="true" />
                หมวด
              </Button>
            )}
            {canManage && (
              <Link href="/rewards/new" className={buttonVariants()}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                เพิ่มของรางวัล
              </Link>
            )}
          </div>
        }
      />
      <TwoColumnLayout
        sidebar={<RewardSearchPanel filters={filters} onApply={(d) => setFilters((f) => ({ ...f, ...d, page: 1 }))} />}
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
            actions={(r) => <RewardRowActions r={r} canManage={canManage} />}
          />
        }
      />
      <CategoryManager open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </>
  );
}

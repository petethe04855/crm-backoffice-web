"use client";

import { ImagePlus } from "lucide-react";
import { DataTable, type Column } from "@/components/common/DataTable";
import { RowActions } from "@/components/common/RowActions";
import { formatThaiDateTime } from "@/lib/utils";
import type { ApiListResponse } from "@/types/api";
import { PLACEMENT_LABEL, type Promotion } from "../types/promotion";
import { PromotionPublicSwitch } from "./PromotionPublicSwitch";
import { mediaUrl } from "@/lib/media";
import { LineVisibilityBadge } from "@/features/line-oa/components/LineVisibilityBadge";
import { useDeletePromotion } from "../hooks/usePromotions";

/** "18 พ.ย. 2569 10:00 → 20 พ.ย. 2569 20:00", or "ยังไม่กำหนด". */
export function formatWindow(
  p: Pick<Promotion, "displayStartAt" | "displayEndAt">,
): string {
  if (!p.displayStartAt || !p.displayEndAt) return "ยังไม่กำหนด";
  return `${formatThaiDateTime(p.displayStartAt)} → ${formatThaiDateTime(p.displayEndAt)}`;
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-10 w-16 items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- uploaded files live on the API host
    <img
      src={mediaUrl(src)}
      alt={alt}
      className="h-10 w-16 rounded border border-neutral-200 object-cover"
    />
  );
}

function makeColumns(canManage: boolean): Column<Promotion>[] {
  return [
    {
      key: "imageUrl",
      label: "รูป",
      render: (p) => <Thumbnail src={p.imageUrl} alt={p.title} />,
    },
    {
      key: "title",
      label: "ชื่อ",
      render: (p) => (
        <span className="font-medium text-neutral-900">{p.title}</span>
      ),
    },
    {
      key: "placement",
      label: "ตำแหน่ง",
      render: (p) => PLACEMENT_LABEL[p.placement],
    },
    {
      key: "displayStartAt",
      label: "ช่วงที่แสดง",
      render: (p) => formatWindow(p),
    },
    {
      key: "status",
      label: "สถานะ",
      render: (p) => (
        <PromotionPublicSwitch promotion={p} canManage={canManage} />
      ),
    },
    {
      key: "lineVisibility",
      label: "LINE OA",
      render: (p) => <LineVisibilityBadge value={p.lineVisibility} />,
    },
    { key: "priority", label: "ลำดับ", render: (p) => String(p.priority) },
  ];
}

/** edit / delete (drafts only). The public switch lives in the status column. */
function PromotionRowActions({
  p,
  canManage,
}: {
  p: Promotion;
  canManage: boolean;
}) {
  const remove = useDeletePromotion();
  if (!canManage)
    return <RowActions editHref={`/promotions/${p.id}`} confirmDelete="" />;

  return (
    <RowActions
      editHref={`/promotions/${p.id}`}
      remove={{
        label: "ลบ",
        run: () => remove.mutateAsync(p.id),
        disabledReason:
          p.status === "draft" ? undefined : "ลบได้เฉพาะโปรที่ยังไม่เคยเผยแพร่",
      }}
      confirmDelete={`ลบโปรโมชั่น "${p.title}"? การลบย้อนกลับไม่ได้`}
    />
  );
}

/** Column 2 of the promotion page. */
export function PromotionTable({
  data,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onLimitChange,
  canManage = false,
}: {
  canManage?: boolean;
  data: ApiListResponse<Promotion> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <DataTable
      rows={data?.data ?? []}
      columns={makeColumns(canManage)}
      meta={data?.meta ?? { page: 1, limit: 20, total: 0 }}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      actions={(p) => <PromotionRowActions p={p} canManage={canManage} />}
    />
  );
}

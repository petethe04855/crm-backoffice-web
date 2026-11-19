"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { buttonVariants } from "@/components/ui/button";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { usePromotionList } from "../hooks/usePromotions";
import { EMPTY_PROMOTION_FILTERS, type PromotionFilters } from "../types/promotion";
import { PromotionSearchPanel } from "./PromotionSearchPanel";
import { PromotionTable } from "./PromotionTable";

export function PromotionListView() {
  const [filters, setFilters] = useState<PromotionFilters>(EMPTY_PROMOTION_FILTERS);
  const list = usePromotionList(filters);
  const canManage = hasPermission(useAuthStore((s) => s.session), PERMISSIONS.promotionsManage);

  return (
    <>
      <PageHeader
        title="โปรโมชั่น"
        description="กำหนดว่าเดือนนี้มีโปรอะไรแสดงใน LINE OA และช่วงวันที่แสดงผล"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/promotions/calendar" className={buttonVariants({ variant: "outline" })}>
              <CalendarDays className="mr-1 h-4 w-4" aria-hidden="true" />
              ปฏิทินรายเดือน
            </Link>
            {canManage && (
              <Link href="/promotions/new" className={buttonVariants()}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                สร้างโปรโมชั่น
              </Link>
            )}
          </div>
        }
      />
      <TwoColumnLayout
        sidebar={
          <PromotionSearchPanel
            filters={filters}
            onApply={(next) => setFilters((f) => ({ ...f, ...next, page: 1 }))}
          />
        }
        content={
          <PromotionTable
            data={list.data}
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

"use client";

import Link from "next/link";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { PageHeader } from "@/components/layout/PageHeader";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { usePromotion } from "../hooks/usePromotions";
import { PromotionForm } from "./PromotionForm";

/** Loads one promotion and renders the form (read-only without manage). */
export function PromotionDetailView({ id }: { id: string }) {
  const query = usePromotion(id);
  const canManage = hasPermission(useAuthStore((s) => s.session), PERMISSIONS.promotionsManage);

  if (query.isLoading) return <Loading message="กำลังโหลดโปรโมชั่น…" />;

  if (query.isError) {
    return (
      <>
        <PageHeader
          title="โปรโมชั่น"
          actions={
            <Link href="/promotions" className="text-sm text-primary underline-offset-4 hover:underline">
              กลับไปหน้ารายการ
            </Link>
          }
        />
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      </>
    );
  }

  if (!query.data) return null;

  return <PromotionForm key={query.data.id} promotion={query.data} canManage={canManage} />;
}

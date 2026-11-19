"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Button } from "@/components/ui/button";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { useExportMembers, useMemberList, useTiers } from "../hooks/useMembers";
import { EMPTY_MEMBER_FILTERS, type MemberFilters } from "../types/member";
import { MemberSearchPanel } from "./MemberSearchPanel";
import { MemberTable } from "./MemberTable";

export function MemberListView() {
  const [filters, setFilters] = useState<MemberFilters>(EMPTY_MEMBER_FILTERS);
  const list = useMemberList(filters);
  const tiers = useTiers();
  const exportMembers = useExportMembers();
  const canExport = hasPermission(useAuthStore((s) => s.session), PERMISSIONS.membersExport);

  return (
    <>
      <PageHeader
        title="สมาชิก"
        description="สมาชิกที่สมัครผ่าน LINE OA"
        actions={
          canExport && (
            <div className="flex flex-col items-end gap-1">
              <Button variant="outline" onClick={() => exportMembers.mutate(filters)} disabled={exportMembers.isPending}>
                <Download className="h-4 w-4 mr-1" />
                {exportMembers.isPending ? "กำลังส่งออก…" : "ส่งออก Excel"}
              </Button>
              {exportMembers.error instanceof Error && (
                <p role="alert" className="text-xs text-red-600">
                  {exportMembers.error.message}
                </p>
              )}
            </div>
          )
        }
      />
      <TwoColumnLayout
        sidebar={
          <MemberSearchPanel
            filters={filters}
            tiers={tiers.data ?? []}
            onApply={(next) => setFilters((f) => ({ ...f, ...next, page: 1 }))}
          />
        }
        content={
          <MemberTable
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

"use client";

import { useState, type FormEvent } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { SearchPanel } from "@/components/common/SearchPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDateTime } from "@/lib/utils";
import {
  useGrantStaffRole,
  useRevokeStaffRole,
  useStaffRoles,
} from "../hooks/useStaffRoles";

/** Owner-only: grant or revoke the CRM "admin" role for ERP staff accounts. */
export function StaffRolesView() {
  const roles = useStaffRoles();
  const grant = useGrantStaffRole();
  const revoke = useRevokeStaffRole();
  const [erpUserId, setErpUserId] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const id = Number(erpUserId);
    if (!Number.isInteger(id) || id <= 0) {
      setFormError("กรุณากรอกรหัสผู้ใช้ ERP เป็นตัวเลข");
      return;
    }
    grant.mutate(
      { erpUserId: id, email: email.trim(), role: "admin" },
      {
        onSuccess: () => {
          setErpUserId("");
          setEmail("");
        },
      },
    );
  };

  const error =
    formError ?? (grant.error instanceof Error ? grant.error.message : null);

  return (
    <>
      <PageHeader
        title="ผู้ใช้ CRM"
        description="กำหนดสิทธิ์ admin ของ CRM ให้พนักงานที่มีบัญชีใน ERP (เฉพาะ owner) — role อื่นมาจาก ERP"
      />
      <TwoColumnLayout
        filtersOnTop
        sidebar={
          <SearchPanel title="ให้สิทธิ์ admin">
            <form
              onSubmit={submit}
              className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="sr-id">รหัสผู้ใช้ ERP</Label>
                <Input
                  id="sr-id"
                  inputMode="numeric"
                  placeholder="ดูได้จากหน้าผู้ใช้ในระบบ ERP"
                  value={erpUserId}
                  onChange={(e) => setErpUserId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sr-email">อีเมล (ไว้แสดงผล)</Label>
                <Input
                  id="sr-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full sm:col-start-2 lg:col-start-4"
                disabled={grant.isPending}
              >
                {grant.isPending ? "กำลังบันทึก…" : "ให้สิทธิ์ admin"}
              </Button>
              {error && (
                <p role="alert" className="col-span-full text-xs text-red-600">
                  {error}
                </p>
              )}
            </form>
          </SearchPanel>
        }
        content={
          roles.isLoading ? (
            <Loading />
          ) : roles.isError ? (
            <ErrorState
              message={roles.error.message}
              onRetry={() => roles.refetch()}
            />
          ) : (
            <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-600">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap text-left">
                      รหัสผู้ใช้ ERP
                    </th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">
                      อีเมล
                    </th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">
                      สิทธิ์
                    </th>
                    <th className="px-5 py-3 whitespace-nowrap text-left">
                      ให้สิทธิ์เมื่อ
                    </th>
                    <th className="px-5 py-3 whitespace-nowrap text-right">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(roles.data ?? []).map((r) => (
                    <tr key={r.erpUserId}>
                      <td className="px-5 py-3 whitespace-nowrap font-mono">
                        {r.erpUserId}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {r.email || "—"}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">{r.role}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {formatThaiDateTime(r.grantedAt)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revoke.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `ยกเลิกสิทธิ์ admin ของผู้ใช้ #${r.erpUserId}?`,
                              )
                            )
                              revoke.mutate(r.erpUserId);
                          }}
                        >
                          ยกเลิกสิทธิ์
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {roles.data?.length === 0 && (
                <p className="py-12 text-center text-sm text-neutral-500">
                  ยังไม่มีผู้ใช้ที่ได้สิทธิ์ admin ของ CRM
                </p>
              )}
            </section>
          )
        }
      />
    </>
  );
}

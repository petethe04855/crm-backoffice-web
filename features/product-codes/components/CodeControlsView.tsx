"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/features/auth/types/auth";
import type { CodePolicy } from "../api/codeControlApi";
import {
  useAddTestMember,
  useCodePolicy,
  useFlaggedMembers,
  useRemoveTestMember,
  useSaveCodePolicy,
  useTestMembers,
} from "../hooks/useCodeControls";

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Member-side limits, members flagged for guessing, and test members. */
export function CodeControlsView() {
  return (
    <>
      <PageHeader
        title="ตั้งค่าการกรอกรหัส"
        description="โควตาต่อวัน, การล็อกเมื่อกรอกผิด, สมาชิกที่ถูกล็อก 24 ชม. และผู้ทดสอบที่ใช้รหัสจากล็อตทดสอบได้"
      />
      <Link href="/product-codes" className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        กลับไปล็อตรหัส
      </Link>
      <div className="grid gap-4 lg:grid-cols-2">
        <PolicyCard />
        <FlaggedCard />
        <div className="lg:col-span-2">
          <TestersCard />
        </div>
      </div>
    </>
  );
}

function PolicyCard() {
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.roles.includes("owner") ?? false;
  const policy = useCodePolicy();
  const save = useSaveCodePolicy();
  const [draft, setDraft] = useState<CodePolicy | null>(null);
  const values = draft ?? policy.data;

  if (policy.isLoading) return <Loading />;
  if (policy.isError || !values) return <ErrorState message={policy.error?.message ?? "โหลดไม่สำเร็จ"} onRetry={() => policy.refetch()} />;

  const field = (key: keyof CodePolicy, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pol-${key}`}>{label}</Label>
      <Input
        id={`pol-${key}`}
        type="number"
        min={1}
        disabled={!isOwner}
        value={values[key]}
        onChange={(e) => setDraft({ ...values, [key]: Number(e.target.value) })}
      />
    </div>
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(values, { onSuccess: () => setDraft(null) });
  };

  return (
    <Card title="ข้อจำกัดการกรอกรหัส" description={isOwner ? undefined : "เฉพาะ owner แก้ไขได้"}>
      <form onSubmit={submit} className="space-y-3">
        {field("dailyQuota", "จำนวนรหัสที่กรอกได้ต่อวัน")}
        {field("wrongPerHour", "กรอกผิดกี่ครั้งใน 1 ชม. จึงล็อก 1 ชม.")}
        {field("wrongPerDay", "กรอกผิดกี่ครั้งใน 24 ชม. จึงล็อก 24 ชม. และแจ้งเตือน")}
        {save.error && <p className="text-xs text-red-600">{save.error.message}</p>}
        {isOwner && (
          <Button type="submit" disabled={save.isPending || !draft}>
            {save.isPending ? "กำลังบันทึก…" : "บันทึก"}
          </Button>
        )}
      </form>
    </Card>
  );
}

function FlaggedCard() {
  const flagged = useFlaggedMembers();
  return (
    <Card title="สมาชิกที่กรอกรหัสผิดเกินกำหนด (24 ชม.)" description="อาจกำลังสุ่มเดารหัส — ตรวจสอบก่อนพิจารณาระงับบัญชี">
      {flagged.isLoading ? (
        <Loading />
      ) : flagged.isError ? (
        <ErrorState message={flagged.error.message} onRetry={() => flagged.refetch()} />
      ) : flagged.data?.length === 0 ? (
        <p className="text-sm text-neutral-500">ไม่มีสมาชิกที่ถูกล็อก</p>
      ) : (
        <ul className="divide-y divide-neutral-100 text-sm">
          {flagged.data?.map((f) => (
            <li key={f.memberId} className="flex items-center justify-between gap-3 py-2">
              <Link href={`/members/${f.memberId}`} className="min-w-0 hover:underline">
                <span className="font-mono">{f.memberCode}</span> {f.name}
              </Link>
              <span className="shrink-0 text-xs text-neutral-500">
                ผิด {f.wrong} ครั้ง · ล่าสุด {formatThaiDateTime(f.lastAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TestersCard() {
  const testers = useTestMembers();
  const add = useAddTestMember();
  const remove = useRemoveTestMember();
  const session = useAuthStore((s) => s.session);
  const canManage = hasPermission(session, PERMISSIONS.productCodesManage);
  const [memberId, setMemberId] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = Number(memberId);
    if (!Number.isInteger(id) || id <= 0) return;
    add.mutate(id, { onSuccess: () => setMemberId("") });
  };

  return (
    <Card title="ผู้ทดสอบ" description="สมาชิกที่ใช้รหัสจากล็อตทดสอบได้ — สมาชิกคนอื่นจะเห็นรหัสทดสอบเป็น 'ไม่พบรหัส'">
      {canManage && (
        <form onSubmit={submit} className="flex items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="tm-id">รหัสสมาชิกในระบบ (ID)</Label>
            <Input id="tm-id" inputMode="numeric" className="w-40" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
          </div>
          <Button type="submit" disabled={add.isPending}>
            เพิ่มผู้ทดสอบ
          </Button>
        </form>
      )}
      {add.error && <p className="text-xs text-red-600">{add.error.message}</p>}
      {testers.isLoading ? (
        <Loading />
      ) : testers.isError ? (
        <ErrorState message={testers.error.message} onRetry={() => testers.refetch()} />
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs text-neutral-500">
            <tr>
              <th className="py-2 text-left">สมาชิก</th>
              <th className="py-2 text-left">อีเมล</th>
              <th className="py-2 text-left">เพิ่มเมื่อ</th>
              <th className="py-2 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {testers.data?.map((t) => (
              <tr key={t.memberId}>
                <td className="py-2">
                  <span className="font-mono">{t.memberCode}</span> {t.name}
                </td>
                <td className="py-2">{t.email}</td>
                <td className="py-2">{formatThaiDateTime(t.addedAt)}</td>
                <td className="py-2 text-right">
                  <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(t.memberId)}>
                    เอาออก
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {testers.data?.length === 0 && <p className="text-sm text-neutral-500">ยังไม่มีผู้ทดสอบ</p>}
    </Card>
  );
}

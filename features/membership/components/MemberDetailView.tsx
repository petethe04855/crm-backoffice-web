"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PERMISSIONS } from "@/features/auth/types/auth";
import { cn, formatCurrency, formatThaiDateTime } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";
import { maskEmail, maskPhone } from "../lib/mask";
import { useUnlinkLine, useUpdateMemberStatus } from "../hooks/useMemberManagement";
import { useMember } from "../hooks/useMembers";
import { GENDER_LABEL, type MemberDetail } from "../types/member";
import { MemberCouponsTab } from "@/features/coupons/components/MemberCouponsTab";
import { MemberRedemptionsTab } from "@/features/rewards/components/RedemptionViews";
import { MemberNotesTab } from "./MemberNotesTab";
import { MemberPlaceholderTab } from "./MemberPlaceholderTab";
import { MemberPointsTab } from "./MemberPointsTab";
import { MemberStatusBadge } from "./MemberStatusBadge";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900">{children || "—"}</dd>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</dl>
    </section>
  );
}

type TabKey = "profile" | "points" | "codes" | "redemptions" | "coupons" | "notes";

function ProfileTab({ m }: { m: MemberDetail }) {
  const [showPersonalData, setShowPersonalData] = useState(false);

  return (
    <div className="space-y-5">
      <Section title="ข้อมูลสมาชิก">
        <Field label="สถานะ">
          <MemberStatusBadge status={m.status} />
        </Field>
        <Field label="ระดับ">{m.tier?.name}</Field>
        <Field label="แต้มคงเหลือ">{m.pointBalance.toLocaleString("th-TH")}</Field>
        <Field label="ยอดซื้อสะสม">{formatCurrency(m.lifetimeSpend)} บาท</Field>
        <Field label="วันที่สมัคร">{formatThaiDateTime(m.registeredAt)}</Field>
        <Field label="ใช้งานล่าสุด">{m.lastActiveAt ? formatThaiDateTime(m.lastActiveAt) : "ยังไม่เคยเปิดใช้งาน"}</Field>
        <Field label="ลูกค้าใน ERP">{m.erpCustomerId ? `#${m.erpCustomerId}` : "ยังไม่จับคู่"}</Field>
        <Field label="แท็ก">
          {m.tags.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {m.tags.map((t) => (
                <Badge key={t.tag} variant="secondary">
                  {t.tag}
                </Badge>
              ))}
            </span>
          ) : null}
        </Field>
      </Section>
      <Section
        title="ข้อมูลติดต่อ"
        action={
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowPersonalData((v) => !v)}
          >
            {showPersonalData ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                ซ่อนข้อมูล
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                แสดงข้อมูล
              </>
            )}
          </Button>
        }
      >
        <Field label="อีเมล">
          {showPersonalData ? m.email : maskEmail(m.email)}
          {m.emailVerifiedAt && <span className="ml-2 text-xs text-green-700">ยืนยันแล้ว</span>}
        </Field>
        <Field label="เบอร์โทร (ไม่ได้ยืนยัน)">
          {showPersonalData ? m.phone : maskPhone(m.phone)}
        </Field>
        <Field label="วันเกิด">
          {m.birthDate
            ? showPersonalData
              ? formatThaiDateTime(m.birthDate, { includeTime: false })
              : "•• ••• ••••"
            : null}
        </Field>
        <Field label="เพศ">{GENDER_LABEL[m.gender]}</Field>
      </Section>
      <Section title="บัญชี LINE">
        {m.line ? (
          <>
            <Field label="ชื่อใน LINE">{m.line.displayName}</Field>
            <Field label="เป็นเพื่อนกับ OA">{m.line.isFriend ? "ใช่" : "ไม่ใช่"}</Field>
            <Field label="ผูกบัญชีเมื่อ">{formatThaiDateTime(m.line.linkedAt)}</Field>
          </>
        ) : (
          <Field label="สถานะ">ยังไม่ได้ผูกบัญชี LINE</Field>
        )}
      </Section>
    </div>
  );
}

type Confirm = "suspend" | "activate" | "unlink" | null;

const CONFIRM_TEXT: Record<Exclude<Confirm, null>, { title: string; description: string; action: string }> = {
  suspend: {
    title: "ระงับบัญชีสมาชิก",
    description: "สมาชิกจะใช้งาน LINE OA, กรอกรหัส และแลกรางวัลไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง แต้มยังคงอยู่",
    action: "ระงับบัญชี",
  },
  activate: {
    title: "เปิดใช้งานบัญชี",
    description: "สมาชิกจะกลับมาใช้งาน LINE OA ได้ตามปกติ",
    action: "เปิดใช้งาน",
  },
  unlink: {
    title: "ปลดผูกบัญชี LINE",
    description: "บัญชี LINE นี้จะหลุดจากสมาชิก ลูกค้าต้องเข้าสู่ระบบด้วยอีเมลแล้วผูก LINE ใหม่ แต้มและประวัติไม่หาย",
    action: "ปลดผูก LINE",
  },
};

function MemberActions({ m }: { m: MemberDetail }) {
  const [confirm, setConfirm] = useState<Confirm>(null);
  const status = useUpdateMemberStatus(m.id);
  const unlink = useUnlinkLine(m.id);
  const pending = status.isPending || unlink.isPending;
  const error = status.error ?? unlink.error;

  const close = () => {
    setConfirm(null);
    status.reset();
    unlink.reset();
  };
  const run = () => {
    if (confirm === "unlink") unlink.mutate(undefined, { onSuccess: close });
    else if (confirm) status.mutate(confirm === "suspend" ? "suspended" : "active", { onSuccess: close });
  };
  const text = confirm ? CONFIRM_TEXT[confirm] : null;

  return (
    <>
      {m.status === "active" && (
        <Button variant="outline" onClick={() => setConfirm("suspend")}>
          ระงับบัญชี
        </Button>
      )}
      {m.status === "suspended" && (
        <Button variant="outline" onClick={() => setConfirm("activate")}>
          เปิดใช้งาน
        </Button>
      )}
      {m.line && (
        <Button variant="outline" onClick={() => setConfirm("unlink")}>
          ปลดผูก LINE
        </Button>
      )}
      <Modal
        open={text !== null}
        title={text?.title ?? ""}
        description={text?.description}
        onClose={close}
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={pending}>
              ยกเลิก
            </Button>
            <Button variant={confirm === "activate" ? "default" : "destructive"} onClick={run} disabled={pending}>
              {pending ? "กำลังบันทึก…" : text?.action}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-700">
          {m.firstName} {m.lastName} ({m.memberCode})
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error.message}
          </p>
        )}
      </Modal>
    </>
  );
}

export function MemberDetailView({ id }: { id: number }) {
  const { data: m, isLoading, isError, error, refetch } = useMember(id);
  const session = useAuthStore((s) => s.session);
  const [tab, setTab] = useState<TabKey>("profile");

  const can = (perm: string) => hasPermission(session, perm);
  const canManage = can(PERMISSIONS.membersManage);

  const back = (
    <Link href="/members" className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeft className="h-4 w-4 mr-1" />
      กลับไปหน้ารายชื่อ
    </Link>
  );

  if (isLoading) return <Loading message="กำลังโหลดข้อมูลสมาชิก…" />;
  if (isError || !m) {
    const notFound = (error as { status?: number } | null)?.status === 404;
    return (
      <>
        {back}
        <ErrorState
          title={notFound ? "ไม่พบสมาชิก" : "โหลดข้อมูลไม่สำเร็จ"}
          message={notFound ? "สมาชิกนี้อาจถูกลบหรือรหัสไม่ถูกต้อง" : error?.message}
          onRetry={notFound ? undefined : () => refetch()}
        />
      </>
    );
  }

  const tabs: { key: TabKey; label: string; visible: boolean }[] = [
    { key: "profile", label: "ข้อมูลส่วนตัว", visible: true },
    { key: "points", label: "แต้ม", visible: can(PERMISSIONS.pointsView) },
    { key: "codes", label: "การกรอกรหัสสินค้า", visible: true },
    { key: "redemptions", label: "การแลกรางวัล", visible: true },
    { key: "coupons", label: "คูปอง", visible: true },
    { key: "notes", label: "บันทึกหลังบ้าน", visible: can(PERMISSIONS.membersNotes) },
  ];
  const visible = tabs.filter((t) => t.visible);
  const active = visible.some((t) => t.key === tab) ? tab : "profile";

  return (
    <>
      <PageHeader
        title={`${m.firstName} ${m.lastName}`}
        description={m.memberCode}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {back}
            {canManage && m.status !== "deleted" && <MemberActions m={m} />}
          </div>
        }
      />

      <div role="tablist" aria-label="ข้อมูลสมาชิก" className="mb-5 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {visible.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors",
              active === t.key
                ? "border-neutral-900 font-medium text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {active === "profile" && <ProfileTab m={m} />}
        {active === "points" && (
          <MemberPointsTab memberId={m.id} balance={m.pointBalance} canAdjust={can(PERMISSIONS.pointsAdjust)} />
        )}
        {active === "codes" && <MemberPlaceholderTab title="ประวัติการกรอกรหัสสินค้า" milestone="P2 ล็อตรหัสสินค้า" />}
        {active === "redemptions" && <MemberRedemptionsTab memberId={m.id} />}
        {active === "coupons" && <MemberCouponsTab memberId={m.id} canCancel={can(PERMISSIONS.couponsManage)} />}
        {active === "notes" && (
          <MemberNotesTab memberId={m.id} tags={m.tags} canManageTags={canManage} canAddNotes={can(PERMISSIONS.membersNotes)} />
        )}
      </div>
    </>
  );
}

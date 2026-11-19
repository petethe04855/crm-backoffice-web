"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { Loading } from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdjustPolicy,
  useExpiryPolicy,
  useRedeemPolicy,
  useSaveAdjustPolicy,
  useSaveExpiryPolicy,
  useSaveRedeemPolicy,
} from "../hooks/usePointRules";
import { wholeNumberError } from "../schemas/pointRuleForms";
import { REDEEM_STATUS_OPTIONS, type AdjustPolicy, type ExpiryPolicy, type RedeemPolicy } from "../types/pointRules";

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-neutral-500">{description}</p>
      {children}
    </section>
  );
}

function NumberField({
  id,
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} inputMode="numeric" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function SaveRow({ pending, error, saved, canManage }: { pending: boolean; error: string | null; saved: boolean; canManage: boolean }) {
  if (!canManage) return <p className="text-xs text-neutral-500">เฉพาะเจ้าของระบบ (owner) แก้ไขได้</p>;
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && !error && <p className="text-sm text-green-700">บันทึกแล้ว</p>}
    </div>
  );
}

function RedeemPolicyForm({ policy, canManage }: { policy: RedeemPolicy; canManage: boolean }) {
  const [v, setV] = useState({
    minBalance: String(policy.minBalanceToRedeem),
    minAge: String(policy.minMemberAgeDays),
    maxPerDay: String(policy.maxRedemptionsPerDay),
    requireEmail: policy.requireEmailVerified,
    statuses: policy.allowedStatuses,
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const save = useSaveRedeemPolicy();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err =
      wholeNumberError(v.minBalance, "แต้มขั้นต่ำ", 10_000_000) ??
      wholeNumberError(v.minAge, "อายุสมาชิก", 3650) ??
      wholeNumberError(v.maxPerDay, "จำนวนครั้งต่อวัน", 1000) ??
      (v.statuses.length === 0 ? "เลือกสถานะสมาชิกที่แลกได้อย่างน้อย 1 สถานะ" : null);
    setLocalError(err);
    if (err) return;
    save.mutate({
      minBalanceToRedeem: Number(v.minBalance),
      minMemberAgeDays: Number(v.minAge),
      maxRedemptionsPerDay: Number(v.maxPerDay),
      requireEmailVerified: v.requireEmail,
      allowedStatuses: v.statuses,
    });
  };

  const toggleStatus = (status: string, on: boolean) =>
    setV((s) => ({ ...s, statuses: on ? [...s.statuses, status] : s.statuses.filter((x) => x !== status) }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumberField id="rp-min" label="แต้มคงเหลือขั้นต่ำ" hint="0 = ไม่กำหนด" value={v.minBalance} disabled={!canManage} onChange={(x) => setV((s) => ({ ...s, minBalance: x }))} />
        <NumberField id="rp-age" label="เป็นสมาชิกอย่างน้อย (วัน)" hint="กันสมัครแล้วแลกทันที" value={v.minAge} disabled={!canManage} onChange={(x) => setV((s) => ({ ...s, minAge: x }))} />
        <NumberField id="rp-day" label="แลกได้สูงสุดต่อวัน (ครั้ง)" hint="รวมของรางวัลและคูปอง, 0 = ไม่จำกัด" value={v.maxPerDay} disabled={!canManage} onChange={(x) => setV((s) => ({ ...s, maxPerDay: x }))} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={v.requireEmail} disabled={!canManage} onChange={(e) => setV((s) => ({ ...s, requireEmail: e.target.checked }))} />
        ต้องยืนยันอีเมลแล้วจึงแลกได้
      </label>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">สถานะสมาชิกที่แลกได้</legend>
        <div className="flex gap-4">
          {REDEEM_STATUS_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={v.statuses.includes(o.value)} disabled={!canManage} onChange={(e) => toggleStatus(o.value, e.target.checked)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <SaveRow pending={save.isPending} error={localError ?? save.error?.message ?? null} saved={save.isSuccess} canManage={canManage} />
    </form>
  );
}

function ExpiryPolicyForm({ policy, canManage }: { policy: ExpiryPolicy; canManage: boolean }) {
  const [months, setMonths] = useState(String(policy.months));
  const [localError, setLocalError] = useState<string | null>(null);
  const save = useSaveExpiryPolicy();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = wholeNumberError(months, "จำนวนเดือน", 120);
    setLocalError(err);
    if (!err) save.mutate({ mode: "rolling_months", months: Number(months) });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="max-w-xs">
        <NumberField id="exp-months" label="แต้มหมดอายุหลังได้รับ (เดือน)" hint="ตัดแต้มเก่าก่อน (FIFO) ทุกคืน 00:10 น. · 0 = ไม่หมดอายุ" value={months} disabled={!canManage} onChange={setMonths} />
      </div>
      <SaveRow pending={save.isPending} error={localError ?? save.error?.message ?? null} saved={save.isSuccess} canManage={canManage} />
    </form>
  );
}

/** Redeem conditions + point lifetime. */
export function RedeemPolicyTab({ canManage }: { canManage: boolean }) {
  const redeem = useRedeemPolicy();
  const expiry = useExpiryPolicy();
  return (
    <div className="space-y-5">
      <Card title="เงื่อนไขการแลก" description="ใช้กับทุกการแลกของรางวัลและคูปอง แต้มที่ใช้แลกกำหนดที่ตัวรางวัล/คูปอง">
        {redeem.isLoading && <Loading />}
        {redeem.isError && <ErrorState message={redeem.error.message} onRetry={() => redeem.refetch()} />}
        {redeem.data && <RedeemPolicyForm policy={redeem.data} canManage={canManage} />}
      </Card>
      <Card title="อายุแต้ม" description="แต้มที่ได้รับแต่ละครั้งหมดอายุแยกกัน การแก้ค่านี้มีผลกับแต้มที่ได้หลังจากนี้">
        {expiry.isLoading && <Loading />}
        {expiry.isError && <ErrorState message={expiry.error.message} onRetry={() => expiry.refetch()} />}
        {expiry.data && <ExpiryPolicyForm policy={expiry.data} canManage={canManage} />}
      </Card>
    </div>
  );
}

function AdjustPolicyForm({ policy, canManage }: { policy: AdjustPolicy; canManage: boolean }) {
  const [v, setV] = useState({ perAdjust: String(policy.maxPerAdjust), perDay: String(policy.maxPerDay) });
  const [localError, setLocalError] = useState<string | null>(null);
  const save = useSaveAdjustPolicy();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err =
      wholeNumberError(v.perAdjust, "เพดานต่อครั้ง", 100_000) ??
      wholeNumberError(v.perDay, "เพดานต่อวัน", 10_000_000) ??
      (Number(v.perDay) < Number(v.perAdjust) ? "เพดานต่อวันต้องไม่น้อยกว่าเพดานต่อครั้ง" : null);
    setLocalError(err);
    if (!err) save.mutate({ maxPerAdjust: Number(v.perAdjust), maxPerDay: Number(v.perDay) });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid max-w-lg grid-cols-2 gap-4">
        <NumberField id="adj-txn" label="ต่อครั้ง (แต้ม)" value={v.perAdjust} disabled={!canManage} onChange={(x) => setV((s) => ({ ...s, perAdjust: x }))} />
        <NumberField id="adj-day" label="รวมต่อวันต่อผู้ปรับ (แต้ม)" value={v.perDay} disabled={!canManage} onChange={(x) => setV((s) => ({ ...s, perDay: x }))} />
      </div>
      <SaveRow pending={save.isPending} error={localError ?? save.error?.message ?? null} saved={save.isSuccess} canManage={canManage} />
    </form>
  );
}

/** Caps for manual point adjustments by non-owners. */
export function AdjustPolicyTab({ canManage }: { canManage: boolean }) {
  const policy = useAdjustPolicy();
  return (
    <Card title="เพดานปรับแต้ม" description="ใช้กับพนักงานที่ไม่ใช่ owner (เช่น admin) — owner ปรับได้ไม่จำกัด">
      {policy.isLoading && <Loading />}
      {policy.isError && <ErrorState message={policy.error.message} onRetry={() => policy.refetch()} />}
      {policy.data && <AdjustPolicyForm policy={policy.data} canManage={canManage} />}
    </Card>
  );
}

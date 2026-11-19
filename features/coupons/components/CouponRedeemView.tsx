"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatThaiDateTime } from "@/lib/utils";
import { useLookupCoupon, useUseCoupon } from "../hooks/useCoupons";
import { describeBenefit } from "../lib/benefit";
import { CHANNEL_LABEL, type CodeView } from "../types/coupon";

const REASON_TEXT: Record<string, string> = {
  used: "คูปองนี้ถูกใช้ไปแล้ว",
  expired: "คูปองนี้หมดอายุแล้ว",
  cancelled: "คูปองนี้ถูกยกเลิกแล้ว",
};

function CodeCard({ view }: { view: CodeView }) {
  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {view.usable ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
        )}
        <p className="font-semibold">{view.usable ? "ใช้ได้" : REASON_TEXT[view.reason] ?? "ใช้ไม่ได้"}</p>
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-neutral-500">คูปอง</dt>
          <dd className="font-medium">{view.coupon.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">สิทธิ์</dt>
          <dd>{describeBenefit(view.coupon)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">สมาชิก</dt>
          <dd>
            {view.member.name} ({view.member.memberCode})
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">ใช้ได้ถึง</dt>
          <dd>{formatThaiDateTime(view.expiresAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">ช่องทาง</dt>
          <dd>{CHANNEL_LABEL[view.coupon.channel]}</dd>
        </div>
        {view.usedAt && (
          <div>
            <dt className="text-xs text-neutral-500">ใช้เมื่อ / เลขบิล</dt>
            <dd>
              {formatThaiDateTime(view.usedAt)} · {view.usedRef}
            </dd>
          </div>
        )}
      </dl>
      {view.coupon.terms && <p className="text-xs text-neutral-600 whitespace-pre-wrap">{view.coupon.terms}</p>}
    </div>
  );
}

/** /coupons/redeem — store staff look a code up, enter the bill number and confirm. */
export function CouponRedeemView() {
  const [code, setCode] = useState("");
  const [usedRef, setUsedRef] = useState("");
  const lookup = useLookupCoupon();
  const use = useUseCoupon();
  const [done, setDone] = useState<CodeView | null>(null);

  const view = done ?? lookup.data ?? null;

  const find = (e: FormEvent) => {
    e.preventDefault();
    setDone(null);
    use.reset();
    if (code.trim()) lookup.mutate(code.trim().toUpperCase());
  };

  const confirm = (e: FormEvent) => {
    e.preventDefault();
    if (!view || !usedRef.trim()) return;
    use.mutate({ code: view.code, usedRef: usedRef.trim() }, { onSuccess: (v) => setDone(v) });
  };

  const startOver = () => {
    setCode("");
    setUsedRef("");
    setDone(null);
    lookup.reset();
    use.reset();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="กดใช้คูปอง" description="สำหรับพนักงานหน้าร้าน: ค้นรหัสคูปองของลูกค้า แล้วยืนยันพร้อมเลขบิล" />

      <form onSubmit={find} className="flex items-end gap-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="redeem-code">รหัสคูปอง</Label>
          <Input
            id="redeem-code"
            autoFocus
            autoComplete="off"
            className="font-mono uppercase tracking-wider"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น ABCD2345EF"
          />
        </div>
        <Button type="submit" disabled={!code.trim() || lookup.isPending}>
          {lookup.isPending ? "กำลังค้นหา…" : "ค้นหา"}
        </Button>
      </form>

      {lookup.error && (
        <p role="alert" className="text-sm text-red-600">
          {(lookup.error as { status?: number }).status === 404 ? "ไม่พบรหัสคูปองนี้" : lookup.error.message}
        </p>
      )}

      {view && <CodeCard view={view} />}

      {view && view.usable && !done && (
        <form onSubmit={confirm} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="redeem-ref">เลขบิล / เลขออเดอร์</Label>
            <Input id="redeem-ref" value={usedRef} onChange={(e) => setUsedRef(e.target.value)} maxLength={100} />
            <p className="text-xs text-neutral-500">ส่วนลดคิดที่ระบบขาย (POS/ERP) — ที่นี่บันทึกว่าคูปองถูกใช้กับบิลไหน</p>
          </div>
          <Button type="submit" disabled={!usedRef.trim() || use.isPending}>
            {use.isPending ? "กำลังบันทึก…" : "ยืนยันใช้คูปอง"}
          </Button>
          {use.error && (
            <p role="alert" className="text-sm text-red-600">
              {use.error.message}
            </p>
          )}
        </form>
      )}

      {done && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">บันทึกการใช้คูปองแล้ว (บิล {done.usedRef})</p>
          <Button type="button" variant="outline" onClick={startOver}>
            ใช้คูปองถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}

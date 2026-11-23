"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import { ImageUpload } from "@/components/form/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { useSaveAndShowCoupon, useSaveCoupon } from "../hooks/useCoupons";
import { LineVisibilityPanel } from "@/features/line-oa/components/LineVisibilityBadge";
import { describeBenefit } from "../lib/benefit";
import {
  EMPTY_COUPON_FORM,
  couponFormSchema,
  fieldErrors,
  toCouponFormValues,
  toCouponInput,
  type CouponFormValues,
} from "../schemas/couponForm";
import { BENEFIT_LABEL, CHANNEL_LABEL, type Coupon } from "../types/coupon";
import { mediaUrl } from "@/lib/media";
import { ThaiDateInput } from "@/components/form/ThaiDateInput";
import { ThaiDateRangeInput } from "@/components/form/ThaiDateRangeInput";

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** What the member sees in LINE. Display only. */
export function CouponCardPreview({ v }: { v: CouponFormValues }) {
  const value = Number(v.benefitValue) || 0;
  const max = v.maxDiscount ? Number(v.maxDiscount) : null;
  const expiry =
    v.expiryMode === "fixed_date"
      ? v.expiresAt
        ? `ใช้ได้ถึง ${new Date(v.expiresAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}`
        : "ใช้ได้ถึง —"
      : `ใช้ได้ ${v.validDays || "—"} วันหลังแลก`;
  const cost = Number(v.pointsCost) || 0;
  return (
    <div className="w-full max-w-[375px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {v.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded files live on the API host
        <img src={mediaUrl(v.imageUrl)} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center bg-neutral-100 text-neutral-400">
          <Ticket className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1 p-4">
        <p className="text-base font-semibold text-neutral-900">{v.name || "ชื่อคูปอง"}</p>
        <p className="text-sm text-neutral-700">
          {describeBenefit({ benefitType: v.benefitType, benefitValue: value, maxDiscount: max, minSpend: Number(v.minSpend) || 0 })}
        </p>
        <p className="text-xs text-neutral-500">
          {expiry} · ใช้ที่{CHANNEL_LABEL[v.channel]}
        </p>
        <div className="pt-2">
          <span className="inline-block rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white">
            {cost > 0 ? `แลก ${cost.toLocaleString("th-TH")} แต้ม` : "รับฟรี"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Create (no coupon) or edit a coupon template. */
export function CouponForm({ coupon, canManage, extraActions }: { coupon?: Coupon; canManage: boolean; extraActions?: ReactNode }) {
  const router = useRouter();
  const tiers = useTiers();
  const save = useSaveCoupon();
  const saveAndShow = useSaveAndShowCoupon();
  const [values, setValues] = useState<CouponFormValues>(() => (coupon ? toCouponFormValues(coupon) : EMPTY_COUPON_FORM));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const readOnly = !canManage || coupon?.status === "ended";
  const frozen = Boolean(coupon && coupon.claimedCount > 0); // benefit/channel/code locked by the API too

  const set = <K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };

  const submit = (e: FormEvent | null, show = false) => {
    e?.preventDefault();
    const parsed = couponFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    (show ? saveAndShow : save).mutate(
      { id: coupon?.id, input: toCouponInput(values) },
      {
        onSuccess: (c) => {
          setSaved(true);
          if (!coupon) router.push(`/coupons/${c.id}`);
        },
      },
    );
  };
  const pending = save.isPending || saveAndShow.isPending;
  const saveError = saveAndShow.error ?? save.error;
  const canShow = !coupon || coupon.status === "draft" || coupon.status === "paused";

  const hasValue = values.benefitType === "amount_off" || values.benefitType === "percent_off";
  const marketplace = values.channel === "shopee" || values.channel === "tiktok";

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px]">
      <fieldset disabled={readOnly} className="space-y-5">
        <Section title="ข้อมูลคูปอง">
          <Field id="cp-name" label="ชื่อคูปอง" error={errors.name}>
            <Input id="cp-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field id="cp-desc" label="รายละเอียด" error={errors.description}>
            <Textarea id="cp-desc" rows={2} value={values.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <ImageUpload value={values.imageUrl} onChange={(url) => set("imageUrl", url)} label="รูปคูปอง (ไม่บังคับ)" disabled={readOnly} />
          <Field id="cp-terms" label="เงื่อนไขการใช้" error={errors.terms}>
            <Textarea id="cp-terms" rows={3} value={values.terms} onChange={(e) => set("terms", e.target.value)} />
          </Field>
        </Section>

        <Section title="สิทธิประโยชน์">
          {frozen && <p className="text-xs text-amber-700">มีสมาชิกแลกแล้ว แก้สิทธิ์ ช่องทาง และรหัสไม่ได้ (แก้แต้มและวันหมดอายุได้ มีผลกับการแลกครั้งถัดไป)</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="cp-benefit" label="ประเภท">
              <Select id="cp-benefit" value={values.benefitType} disabled={frozen} onChange={(e) => set("benefitType", e.target.value as CouponFormValues["benefitType"])}>
                {Object.entries(BENEFIT_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            {hasValue && (
              <Field id="cp-value" label={values.benefitType === "percent_off" ? "ลด (%)" : "ลด (บาท)"} error={errors.benefitValue}>
                <Input id="cp-value" inputMode="decimal" disabled={frozen} value={values.benefitValue} onChange={(e) => set("benefitValue", e.target.value)} />
              </Field>
            )}
            {values.benefitType === "percent_off" && (
              <Field id="cp-max" label="ลดสูงสุด (บาท)" error={errors.maxDiscount}>
                <Input id="cp-max" inputMode="decimal" disabled={frozen} value={values.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
              </Field>
            )}
            <Field id="cp-min" label="ยอดซื้อขั้นต่ำ (บาท)" error={errors.minSpend}>
              <Input id="cp-min" inputMode="decimal" disabled={frozen} value={values.minSpend} onChange={(e) => set("minSpend", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="การแลกและวันหมดอายุ">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="cp-cost" label="แต้มที่ใช้แลก" hint="0 = แจกฟรี" error={errors.pointsCost}>
              <Input id="cp-cost" inputMode="numeric" value={values.pointsCost} onChange={(e) => set("pointsCost", e.target.value)} />
            </Field>
            <Field id="cp-quota" label="โควตาทั้งหมด (ใบ)" hint="0 = ไม่จำกัด" error={errors.totalQuota}>
              <Input id="cp-quota" inputMode="numeric" value={values.totalQuota} onChange={(e) => set("totalQuota", e.target.value)} />
            </Field>
            <Field id="cp-limit" label="แลกได้ต่อคน (ใบ)" error={errors.limitPerMember}>
              <Input id="cp-limit" inputMode="numeric" value={values.limitPerMember} onChange={(e) => set("limitPerMember", e.target.value)} />
            </Field>
          </div>
          <Field id="cp-claim" label="ช่วงเปิดให้แลก (เว้นว่าง = เปิดทันที / ไม่มีกำหนดปิด)" error={errors.claimEnd}>
            <ThaiDateRangeInput
              id="cp-claim"
              withTime
              optional
              emptyStartLabel="ทันที"
              emptyEndLabel="ไม่มีกำหนด"
              startTimeLabel="เปิดเวลา"
              endTimeLabel="ปิดเวลา"
              value={{ start: values.claimStart, end: values.claimEnd }}
              onChange={(r) => {
                set("claimStart", r.start);
                set("claimEnd", r.end);
              }}
            />
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">วันหมดอายุของคูปอง</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="cp-expiry" checked={values.expiryMode === "days_after_claim"} onChange={() => set("expiryMode", "days_after_claim")} />
              นับจากวันที่แลก
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="cp-expiry" checked={values.expiryMode === "fixed_date"} onChange={() => set("expiryMode", "fixed_date")} />
              หมดพร้อมกันทุกใบ
            </label>
          </fieldset>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {values.expiryMode === "days_after_claim" ? (
              <>
                <Field id="cp-days" label="ใช้ได้กี่วันหลังแลก" hint="หมดอายุสิ้นวันสุดท้าย (เวลาไทย)" error={errors.validDays}>
                  <Input id="cp-days" inputMode="numeric" value={values.validDays} onChange={(e) => set("validDays", e.target.value)} />
                </Field>
                <Field id="cp-cap" label="แต่ไม่เกินวันที่ (ไม่บังคับ)" error={errors.expiresAt}>
                  <ThaiDateInput id="cp-cap" kind="datetime" value={values.expiresAt} onChange={(v) => set("expiresAt", v)} />
                </Field>
              </>
            ) : (
              <Field id="cp-exp" label="หมดอายุวันที่" error={errors.expiresAt}>
                <ThaiDateInput id="cp-exp" kind="datetime" value={values.expiresAt} onChange={(v) => set("expiresAt", v)} />
              </Field>
            )}
          </div>
          <Field id="cp-tier" label="ระดับสมาชิกขั้นต่ำ">
            <Select id="cp-tier" value={values.minTierId} onChange={(e) => set("minTierId", e.target.value)}>
              <option value="">ทุกระดับ</option>
              {(tiers.data ?? []).map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        </Section>

        <Section title="ช่องทางและรหัส">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field id="cp-channel" label="ใช้ที่">
              <Select
                id="cp-channel"
                value={values.channel}
                disabled={frozen}
                onChange={(e) => {
                  const channel = e.target.value as CouponFormValues["channel"];
                  set("channel", channel);
                  if (channel === "shopee" || channel === "tiktok") set("codeType", "shared");
                }}
              >
                {Object.entries(CHANNEL_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="cp-codetype" label="รหัสคูปอง" error={errors.codeType}>
              <Select id="cp-codetype" value={values.codeType} disabled={frozen || marketplace} onChange={(e) => set("codeType", e.target.value as CouponFormValues["codeType"])}>
                <option value="unique">รหัสเฉพาะคน (ตรวจการใช้ได้)</option>
                <option value="shared">รหัสร้านร่วม</option>
              </Select>
            </Field>
            {values.codeType === "shared" && (
              <Field id="cp-shared" label="รหัสร้าน" error={errors.sharedCode}>
                <Input id="cp-shared" disabled={frozen} value={values.sharedCode} onChange={(e) => set("sharedCode", e.target.value.toUpperCase())} />
              </Field>
            )}
          </div>
          {values.codeType === "shared" && (
            <p className="text-xs text-amber-700">รหัสร้านร่วม: CRM ตรวจไม่ได้ว่าใช้จริงหรือไม่ ใช้สำหรับแจกรหัส Shopee/TikTok เท่านั้น</p>
          )}
        </Section>
      </fieldset>

      <aside className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">ตัวอย่างที่ลูกค้าเห็นใน LINE</p>
          <CouponCardPreview v={values} />
        </div>
        <LineVisibilityPanel value={coupon?.lineVisibility} />
        {!readOnly && (
          <div className="space-y-2">
            {canShow && (
              <Button type="button" className="w-full" disabled={pending} onClick={() => submit(null, true)}>
                {saveAndShow.isPending ? "กำลังบันทึก…" : "บันทึกและแสดงใน LINE OA"}
              </Button>
            )}
            <Button type="submit" variant={canShow ? "outline" : "default"} className="w-full" disabled={pending}>
              {save.isPending ? "กำลังบันทึก…" : coupon ? "บันทึกการแก้ไข" : "บันทึกเป็นฉบับร่าง"}
            </Button>
            {saveError && (
              <p role="alert" className="text-sm text-red-600">
                {saveError.message}
              </p>
            )}
            {saved && !saveError && <p className="text-sm text-green-700">บันทึกแล้ว</p>}
          </div>
        )}
        {extraActions}
      </aside>
    </form>
  );
}

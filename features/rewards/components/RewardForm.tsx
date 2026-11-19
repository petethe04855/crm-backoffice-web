"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { ImageUpload } from "@/components/form/ImageUpload";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { formatThaiDateTime } from "@/lib/utils";
import { useERPSKUSearch, useRewardCategories, useSaveReward, useSetRewardStatus } from "../hooks/useRewards";
import {
  EMPTY_REWARD_FORM,
  describeStock,
  fieldErrors,
  rewardFormSchema,
  toRewardFormValues,
  toRewardInput,
  type RewardFormValues,
} from "../schemas/rewardForm";
import { REWARD_STATUS_LABEL, STATUS_VARIANT, type ERPSKU, type Reward, type RewardStatus } from "../types/reward";

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

/** Debounced search of active ERP SKUs; picking one fills SKU id, code and name. */
function SKUPicker({ disabled, onPick }: { disabled: boolean; onPick: (sku: ERPSKU) => void }) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(text), 300);
    return () => clearTimeout(t);
  }, [text]);
  const search = useERPSKUSearch(query);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" aria-hidden="true" />
        <Input
          aria-label="ค้นหาสินค้าใน ERP"
          className="pl-8"
          disabled={disabled}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์รหัสหรือชื่อสินค้าอย่างน้อย 2 ตัว"
        />
      </div>
      {search.isFetching && <p className="text-xs text-neutral-500">กำลังค้นหาใน ERP…</p>}
      {search.isError && <p className="text-xs text-red-600">{search.error.message}</p>}
      {search.data && search.data.length === 0 && <p className="text-xs text-neutral-500">ไม่พบสินค้า</p>}
      {search.data && search.data.length > 0 && (
        <ul className="max-h-60 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200">
          {search.data.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                onClick={() => {
                  onPick(s);
                  setText("");
                  setQuery("");
                }}
              >
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ERP image host
                  <img src={s.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="h-8 w-8 rounded bg-neutral-100" />
                )}
                <span className="flex-1">
                  <span className="font-mono text-xs text-neutral-500">{s.code}</span> {s.name}
                </span>
                <span className="text-xs text-neutral-600">สต็อก {s.availableQty.toLocaleString("th-TH")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const NEXT_STATUS: Partial<Record<RewardStatus, { to: RewardStatus; label: string }[]>> = {
  draft: [{ to: "active", label: "เปิดให้แลก" }],
  active: [
    { to: "inactive", label: "ปิดชั่วคราว" },
    { to: "archived", label: "เก็บถาวร" },
  ],
  inactive: [
    { to: "active", label: "เปิดอีกครั้ง" },
    { to: "archived", label: "เก็บถาวร" },
  ],
};

/** /rewards/new and /rewards/[id]. */
export function RewardForm({ reward, canManage }: { reward?: Reward; canManage: boolean }) {
  const router = useRouter();
  const tiers = useTiers();
  const categories = useRewardCategories();
  const save = useSaveReward();
  const status = useSetRewardStatus();
  const [values, setValues] = useState<RewardFormValues>(() => (reward ? toRewardFormValues(reward) : EMPTY_REWARD_FORM));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const readOnly = !canManage || reward?.status === "archived";
  const skuLocked = Boolean(reward && reward.redeemedCount > 0);
  const set = <K extends keyof RewardFormValues>(k: K, v: RewardFormValues[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    setSaved(false);
  };

  const pick = (s: ERPSKU) => {
    setValues((v) => ({
      ...v,
      erpSkuId: String(s.id),
      skuCode: s.code,
      skuName: s.name,
      // Name and image default from the SKU but stay editable.
      name: v.name || s.name,
      imageUrl: v.imageUrl || s.imageUrl,
    }));
    setSaved(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = rewardFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    save.mutate(
      { id: reward?.id, input: toRewardInput(values) },
      {
        onSuccess: (r) => {
          setSaved(true);
          if (!reward) router.push(`/rewards/${r.id}`);
        },
      },
    );
  };

  const back = (
    <Link href="/rewards" className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeft className="mr-1 h-4 w-4" />
      กลับไปหน้ารายการ
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={reward ? reward.name : "เพิ่มของรางวัล"}
        description={reward ? REWARD_STATUS_LABEL[reward.status] : "บันทึกเป็นฉบับร่างก่อน แล้วกดเปิดให้แลก"}
        actions={back}
      />
      {reward && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["สต็อก ERP", describeStock(reward)],
            ["แลกได้อีก", reward.remainingQuota.toLocaleString("th-TH")],
            ["แลกไปแล้ว", reward.redeemedCount.toLocaleString("th-TH")],
            ["ซิงก์ล่าสุด", reward.stockSyncedAt ? formatThaiDateTime(reward.stockSyncedAt) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value}</p>
            </div>
          ))}
          {reward.stockStale && (
            <p className="col-span-full text-xs text-amber-700">ข้อมูลสต็อกจาก ERP ไม่อัปเดตเกิน 30 นาที (ERP อาจเชื่อมต่อไม่ได้)</p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <fieldset disabled={readOnly} className="space-y-5">
          <Section title="สินค้าจาก ERP">
            {values.erpSkuId ? (
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-mono text-xs text-neutral-500">{values.skuCode}</span> {values.skuName}
                </span>
                {!skuLocked && !readOnly && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => set("erpSkuId", "")}>
                    เปลี่ยน
                  </Button>
                )}
              </div>
            ) : (
              <SKUPicker disabled={readOnly} onPick={pick} />
            )}
            {skuLocked && <p className="text-xs text-amber-700">มีสมาชิกแลกแล้ว เปลี่ยนสินค้าไม่ได้ (สร้างของรางวัลใหม่แทน)</p>}
            {errors.erpSkuId && <p className="text-xs text-red-600">{errors.erpSkuId}</p>}
          </Section>

          <Section title="ข้อมูลที่สมาชิกเห็น">
            <Field id="rw-name" label="ชื่อ" error={errors.name}>
              <Input id="rw-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field id="rw-desc" label="รายละเอียด" error={errors.description}>
              <Textarea id="rw-desc" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <ImageUpload value={values.imageUrl} onChange={(url) => set("imageUrl", url)} label="รูป" disabled={readOnly} />
            <Field id="rw-cat" label="หมวด">
              <Select id="rw-cat" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">ไม่มีหมวด</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section title="แต้มและเงื่อนไข">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="rw-cost" label="แต้มที่ใช้แลก" error={errors.pointsCost}>
                <Input id="rw-cost" inputMode="numeric" value={values.pointsCost} onChange={(e) => set("pointsCost", e.target.value)} />
              </Field>
              <Field id="rw-qty" label="ได้กี่ชิ้นต่อการแลก" error={errors.qtyPerRedemption}>
                <Input id="rw-qty" inputMode="numeric" value={values.qtyPerRedemption} onChange={(e) => set("qtyPerRedemption", e.target.value)} />
              </Field>
              <Field id="rw-sort" label="ลำดับแสดง" error={errors.sortOrder}>
                <Input id="rw-sort" inputMode="numeric" value={values.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
              </Field>
              <Field id="rw-limit" label="โควตาเพิ่มเติม (ใบ)" hint="เว้นว่าง = ตามสต็อก ERP" error={errors.stockLimit}>
                <Input id="rw-limit" inputMode="numeric" value={values.stockLimit} onChange={(e) => set("stockLimit", e.target.value)} />
              </Field>
              <Field id="rw-per" label="แลกได้ต่อคน" hint="เว้นว่าง = ไม่จำกัด" error={errors.limitPerMember}>
                <Input id="rw-per" inputMode="numeric" value={values.limitPerMember} onChange={(e) => set("limitPerMember", e.target.value)} />
              </Field>
              <Field id="rw-tier" label="ระดับขั้นต่ำ">
                <Select id="rw-tier" value={values.minTierId} onChange={(e) => set("minTierId", e.target.value)}>
                  <option value="">ทุกระดับ</option>
                  {(tiers.data ?? []).map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="rw-from" label="เปิดแลกตั้งแต่ (เว้นว่าง = ทันที)">
                <Input id="rw-from" type="datetime-local" value={values.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />
              </Field>
              <Field id="rw-to" label="ถึง (เว้นว่าง = ไม่มีกำหนด)" error={errors.availableTo}>
                <Input id="rw-to" type="datetime-local" value={values.availableTo} onChange={(e) => set("availableTo", e.target.value)} />
              </Field>
            </div>
          </Section>
        </fieldset>

        <aside className="space-y-4">
          {!readOnly && (
            <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending ? "กำลังบันทึก…" : reward ? "บันทึกการแก้ไข" : "บันทึกเป็นฉบับร่าง"}
              </Button>
              {save.error && (
                <p role="alert" className="text-sm text-red-600">
                  {save.error.message}
                </p>
              )}
              {saved && !save.error && <p className="text-sm text-green-700">บันทึกแล้ว</p>}
            </div>
          )}
          {reward && canManage && NEXT_STATUS[reward.status] && (
            <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">
                สถานะ <Badge variant={STATUS_VARIANT[reward.status]}>{REWARD_STATUS_LABEL[reward.status]}</Badge>
              </p>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS[reward.status]!.map((n) => (
                  <Button
                    key={n.to}
                    type="button"
                    variant={n.to === "active" ? "default" : "outline"}
                    disabled={status.isPending}
                    onClick={() => status.mutate({ id: reward.id, status: n.to })}
                  >
                    {n.label}
                  </Button>
                ))}
              </div>
              {status.error && (
                <p role="alert" className="text-sm text-red-600">
                  {status.error.message}
                </p>
              )}
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}

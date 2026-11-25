"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, EyeOff, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "@/components/common/Toaster";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeField } from "@/components/form/DateRangeField";
import { ImageUpload } from "@/components/form/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { useCouponList } from "@/features/coupons/hooks/useCoupons";
import { useRewardList } from "@/features/rewards/hooks/useRewards";
import { cn } from "@/lib/utils";
import {
  EMPTY_PROMOTION_FORM,
  fieldErrors,
  promotionFormSchema,
  toFormValues,
  toPromotionInput,
  type PromotionFormValues,
} from "../schemas/promotionForm";
import { CTA_TYPES, CTA_TYPE_LABEL, type Promotion } from "../types/promotion";
import {
  useCreatePromotion,
  useDuplicatePromotion,
  useDeletePromotion,
  useUnpublishPromotion,
  useUpdatePromotion,
} from "../hooks/usePromotions";
import { PromotionCardPreview } from "./PromotionCardPreview";
import { LineVisibilityPanel } from "@/features/line-oa/components/LineVisibilityBadge";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
}

function CtaTargetSelect({
  kind,
  value,
  disabled,
  invalid,
  onChange,
}: {
  kind: "coupon" | "reward";
  value: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const coupons = useCouponList({
    search: "",
    month: "",
    status: "",
    channel: "",
    page: 1,
    limit: 100,
  });
  const rewards = useRewardList({
    search: "",
    categoryId: "",
    status: "",
    lowStock: false,
    page: 1,
    limit: 100,
  });

  const rows = kind === "coupon" ? (coupons.data?.data ?? []) : (rewards.data?.data ?? []);
  const loading = kind === "coupon" ? coupons.isLoading : rewards.isLoading;
  const isValidId = /^[1-9]\d*$/.test(value);
  const hasCurrent = isValidId && rows.some((r) => String(r.id) === value);
  const selectValue = isValidId ? value : "";

  return (
    <Select
      id="pf-cta-target"
      value={selectValue}
      disabled={disabled || loading}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">
        {loading
          ? "กำลังโหลดรายการ…"
          : kind === "reward"
            ? "-- เลือกของรางวัล --"
            : "-- เลือกคูปอง --"}
      </option>
      {!hasCurrent && isValidId && (
        <option value={value}>#{value}</option>
      )}
      {rows.map((item) => (
        <option key={item.id} value={String(item.id)}>
          #{item.id} — {item.name}
        </option>
      ))}
    </Select>
  );
}

/**
 * Create/edit form. The API is the source of truth for every rule; the Zod
 * schema only short-circuits empty forms so the user does not have to round-trip
 * for obvious mistakes.
 */
export function PromotionForm({
  promotion,
  canManage,
}: {
  /** Absent on /promotions/new. */
  promotion?: Promotion;
  canManage: boolean;
}) {
  const router = useRouter();
  const tiers = useTiers();
  const create = useCreatePromotion();
  const update = useUpdatePromotion();
  const unpublish = useUnpublishPromotion();
  const duplicate = useDuplicatePromotion();
  const remove = useDeletePromotion();

  const [values, setValues] = useState<PromotionFormValues>(() =>
    promotion ? toFormValues(promotion) : EMPTY_PROMOTION_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>(promotion?.warnings ?? []);

  const set = <K extends keyof PromotionFormValues>(
    key: K,
    value: PromotionFormValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const archived = promotion?.status === "archived";
  const readOnly = !canManage || archived;
  const busy =
    create.isPending ||
    update.isPending ||
    unpublish.isPending ||
    duplicate.isPending ||
    remove.isPending;

  const canDelete = promotion?.status === "draft";
  const canUnpublish = promotion?.status === "published";

  /**
   * Validates and writes. Saving keeps the public/unpublic state as it is:
   * staff turn a promotion on in LINE OA with the switch in the list table.
   */
  /** Validates and saves, then returns to the list; warnings follow as toasts. */
  async function handleSave() {
    const parsed = promotionFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setServerError(null);
    const input = toPromotionInput(values);
    let saved: Promotion;
    try {
      saved = promotion
        ? await update.mutateAsync({ id: promotion.id, input })
        : await create.mutateAsync(input);
    } catch (err) {
      setServerError(errorMessage(err));
      return;
    }

    // The form is left right away, so the toasts carry the result.
    toast.success(
      promotion ? `บันทึก "${saved.title}" แล้ว` : `สร้าง "${saved.title}" แล้ว (unpublic)`,
    );
    for (const w of saved.warnings) toast.warning(w);
    router.push("/promotions");
  }

  async function handleUnpublish() {
    if (!promotion) return;
    if (
      !window.confirm(
        `ตั้ง "${promotion.title}" เป็น unpublic? โปรจะหยุดแสดงใน LINE OA`,
      )
    )
      return;
    try {
      const result = await unpublish.mutateAsync(promotion.id);
      setWarnings(result.warnings);
      setServerError(null);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  async function handleDuplicate() {
    if (!promotion) return;
    try {
      const copy = await duplicate.mutateAsync(promotion.id);
      router.replace(`/promotions/${copy.id}`);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  async function handleDelete() {
    if (!promotion) return;
    if (!window.confirm(`ลบ "${promotion.title}"? การลบย้อนกลับไม่ได้`)) return;
    try {
      await remove.mutateAsync(promotion.id);
      router.replace("/promotions");
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title={promotion ? promotion.title : "สร้างโปรโมชั่น"}
        description={
          promotion
            ? "แก้ไขรายละเอียด ช่วงเวลาแสดงผล และกลุ่มเป้าหมาย"
            : "บันทึกเป็น unpublic ก่อน แล้วเปิดแสดงใน LINE OA ด้วยสวิตช์ในหน้ารายการ"
        }
        actions={
          <Link
            href="/promotions"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            กลับไปหน้ารายการ
          </Link>
        }
      />

      {!canManage && (
        <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600">
          คุณมีสิทธิ์ดูโปรโมชั่นอย่างเดียว จึงแก้ไขไม่ได้
        </p>
      )}
      {archived && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          โปรนี้ถูกเก็บถาวรแล้ว แก้ไขหรือเผยแพร่ไม่ได้ — ใช้ “ทำสำเนา”
          เพื่อสร้างร่างใหม่
        </p>
      )}
      {warnings.length > 0 && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          <p className="font-medium">คำเตือน (บันทึกแล้ว แต่ควรตรวจสอบ)</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {serverError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {serverError}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_375px] lg:items-start">
        <div className="space-y-6">
          {canManage && !archived && (
            <section className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <Button type="button" onClick={handleSave} disabled={busy}>
                {create.isPending || update.isPending ? (
                  <Loader2
                    className="mr-1 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                บันทึก
              </Button>
              {canUnpublish && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={busy}
                >
                  <EyeOff className="mr-1 h-4 w-4" aria-hidden="true" />
                  ตั้งเป็น unpublic
                </Button>
              )}
              {/* {promotion && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={busy}
                >
                  <Copy className="mr-1 h-4 w-4" aria-hidden="true" />
                  ทำสำเนา
                </Button>
              )} */}
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={busy}
                  className="ml-auto"
                >
                  <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                  ลบ
                </Button>
              )}
            </section>
          )}
          <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">ข้อมูลโปรโมชั่น</h2>

            <div className="space-y-1.5">
              <Label htmlFor="pf-title">ชื่อโปรโมชั่น *</Label>
              <Input
                id="pf-title"
                value={values.title}
                maxLength={120}
                disabled={readOnly}
                aria-invalid={Boolean(errors.title) || undefined}
                onChange={(e) => set("title", e.target.value)}
              />
              <div className="flex justify-between gap-2">
                <FieldError message={errors.title} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {values.title.length}/120
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pf-description">รายละเอียด</Label>
              <Textarea
                id="pf-description"
                rows={4}
                value={values.description}
                maxLength={2000}
                disabled={readOnly}
                onChange={(e) => set("description", e.target.value)}
              />
              <div className="flex justify-between gap-2">
                <FieldError message={errors.description} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {values.description.length}/2,000
                </span>
              </div>
            </div>

            <ImageUpload
              value={values.imageUrl}
              onChange={(url) => set("imageUrl", url)}
              disabled={readOnly}
              label="รูปแบนเนอร์"
              error={errors.imageUrl}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">ช่วงเวลาที่แสดง</h2>

            <DateRangeField
              label="ช่วงวัน-เวลาแสดงผล"
              withTime
              required
              disabled={readOnly}
              value={{ start: values.displayStart, end: values.displayEnd }}
              onChange={(range) => {
                set("displayStart", range.start);
                set("displayEnd", range.end);
              }}
              error={errors.displayEnd ?? errors.displayStart}
            />
            <p className="text-xs text-muted-foreground">
              ระบบคำนวณสถานะจากเวลานี้เอง — ตั้งเวลาไว้ล่วงหน้าได้
              ไม่ต้องกลับมากดเผยแพร่ซ้ำ
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">ปุ่มนำทาง (CTA)</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-cta">ประเภท</Label>
                <Select
                  id="pf-cta"
                  value={values.ctaType}
                  disabled={readOnly}
                  onChange={(e) => {
                    const next = e.target.value as PromotionFormValues["ctaType"];
                    set("ctaType", next);
                    set("ctaTarget", "");
                  }}
                >
                  {CTA_TYPES.filter((t) => t !== "coupon").map((t) => (
                    <option key={t} value={t}>
                      {CTA_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </div>
              {values.ctaType !== "none" && (
                <div className="space-y-1.5">
                  <Label htmlFor="pf-cta-target">
                    {values.ctaType === "url"
                      ? "ลิงก์ (https://…)"
                      : values.ctaType === "reward"
                        ? "ของรางวัล (เลือกจากรายการ)"
                        : "คูปอง (เลือกจากรายการ)"}
                  </Label>
                  {values.ctaType === "url" ? (
                    <Input
                      id="pf-cta-target"
                      value={values.ctaTarget}
                      disabled={readOnly}
                      aria-invalid={Boolean(errors.ctaTarget) || undefined}
                      placeholder="https://example.com/promo"
                      onChange={(e) => set("ctaTarget", e.target.value)}
                    />
                  ) : (
                    <CtaTargetSelect
                      kind={values.ctaType}
                      value={values.ctaTarget}
                      disabled={readOnly}
                      invalid={Boolean(errors.ctaTarget)}
                      onChange={(v) => set("ctaTarget", v)}
                    />
                  )}
                  <FieldError message={errors.ctaTarget} />
                </div>
              )}
            </div>
          </section>

          {/* <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">กลุ่มเป้าหมาย</h2>
            <p className="text-xs text-muted-foreground">
              ไม่เลือกอะไรเลย = สมาชิกทุกคนเห็น · เลือกหลายเงื่อนไข =
              ต้องตรงทุกเงื่อนไข
            </p>

            <div className="space-y-2">
              <Label>ระดับสมาชิก</Label>
              {tiers.isLoading ? (
                <p className="text-xs text-muted-foreground">
                  กำลังโหลดระดับสมาชิก…
                </p>
              ) : tiers.isError ? (
                <p className="text-xs text-red-600">โหลดระดับสมาชิกไม่สำเร็จ</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {(tiers.data ?? []).map((tier) => {
                    const checked = values.tiers.includes(tier.code);
                    return (
                      <label
                        key={tier.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
                          checked
                            ? "border-primary bg-primary/5"
                            : "border-neutral-200",
                          readOnly && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          disabled={readOnly}
                          onChange={(e) =>
                            set(
                              "tiers",
                              e.target.checked
                                ? [...values.tiers, tier.code]
                                : values.tiers.filter(
                                    (code) => code !== tier.code,
                                  ),
                            )
                          }
                        />
                        {tier.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="pf-new-days">สมาชิกใหม่ภายใน (วัน)</Label>
              <Input
                id="pf-new-days"
                type="number"
                min={1}
                max={3650}
                placeholder="ไม่จำกัด"
                value={values.newMemberDays}
                disabled={readOnly}
                onChange={(e) => set("newMemberDays", e.target.value)}
              />
              <FieldError message={errors.newMemberDays} />
            </div>
          </section> */}

          {/* {archived && canManage && (
            <section className="flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <Button
                type="button"
                variant="outline"
                onClick={handleDuplicate}
                disabled={busy}
              >
                <Copy className="mr-1 h-4 w-4" aria-hidden="true" />
                ทำสำเนาเป็นร่างใหม่
              </Button>
            </section>
          )} */}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <LineVisibilityPanel value={promotion?.lineVisibility} />
          <PromotionCardPreview values={values} />
        </aside>
      </div>
    </>
  );
}

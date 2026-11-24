"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, EyeOff, Loader2, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeField } from "@/components/form/DateRangeField";
import { ImageUpload } from "@/components/form/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { cn } from "@/lib/utils";
import {
  EMPTY_PROMOTION_FORM,
  fieldErrors,
  promotionFormSchema,
  toFormValues,
  toPromotionInput,
  type PromotionFormValues,
} from "../schemas/promotionForm";
import {
  CTA_TYPES,
  CTA_TYPE_LABEL,
  PLACEMENTS,
  PLACEMENT_LABEL,
  type Promotion,
} from "../types/promotion";
import {
  useCreatePromotion,
  useDuplicatePromotion,
  useDeletePromotion,
  usePublishPromotion,
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
  const publish = usePublishPromotion();
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
    publish.isPending ||
    unpublish.isPending ||
    duplicate.isPending ||
    remove.isPending;

  const canDelete = promotion?.status === "draft";
  const canUnpublish = promotion?.status === "published";

  /**
   * Validates and writes. Saving always makes the promotion public (the LINE
   * app shows it immediately); when the API refuses to publish, the row stays
   * unpublic and the reason is shown.
   */
  async function persist(navigateOnCreate: boolean): Promise<Promotion | null> {
    const parsed = promotionFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return null;
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
      return null;
    }

    if (saved.status !== "published" && saved.status !== "archived") {
      try {
        saved = await publish.mutateAsync(saved.id);
      } catch (err) {
        setWarnings(saved.warnings);
        setServerError(
          `บันทึกแล้ว แต่ยังแสดงใน LINE OA ไม่ได้: ${errorMessage(err)}`,
        );
        if (!promotion && navigateOnCreate) {
          router.replace(`/promotions/${saved.id}`);
        }
        return saved;
      }
    }

    setWarnings(saved.warnings);
    if (!promotion && navigateOnCreate) {
      router.replace(`/promotions/${saved.id}`);
    }
    return saved;
  }

  async function handleSave() {
    await persist(true);
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
            : "บันทึกแล้วแสดงใน LINE OA ทันที หากข้อมูลยังไม่ครบจะบันทึกเป็น unpublic"
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
                {promotion?.status === "published"
                  ? "บันทึก"
                  : "บันทึกและเผยแพร่"}
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
              {promotion && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={busy}
                >
                  <Copy className="mr-1 h-4 w-4" aria-hidden="true" />
                  ทำสำเนา
                </Button>
              )}
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
            <h2 className="text-sm font-semibold">ช่วงเวลาและตำแหน่งที่แสดง</h2>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-placement">ตำแหน่ง</Label>
                <Select
                  id="pf-placement"
                  value={values.placement}
                  disabled={readOnly}
                  onChange={(e) =>
                    set(
                      "placement",
                      e.target.value as PromotionFormValues["placement"],
                    )
                  }
                >
                  {PLACEMENTS.map((p) => (
                    <option key={p} value={p}>
                      {PLACEMENT_LABEL[p]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-priority">ลำดับการแสดง (มากก่อน)</Label>
                <Input
                  id="pf-priority"
                  type="number"
                  min={0}
                  max={9999}
                  value={values.priority}
                  disabled={readOnly}
                  onChange={(e) => set("priority", e.target.value)}
                />
                <FieldError message={errors.priority} />
              </div>
            </div>
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
                  onChange={(e) =>
                    set(
                      "ctaType",
                      e.target.value as PromotionFormValues["ctaType"],
                    )
                  }
                >
                  {CTA_TYPES.map((t) => (
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
                        ? "รหัสของรางวัล"
                        : "รหัสคูปอง"}
                  </Label>
                  <Input
                    id="pf-cta-target"
                    value={values.ctaTarget}
                    disabled={readOnly}
                    placeholder={
                      values.ctaType === "url"
                        ? "https://example.com/promo"
                        : "เช่น 123"
                    }
                    onChange={(e) => set("ctaTarget", e.target.value)}
                  />
                  <FieldError message={errors.ctaTarget} />
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
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
          </section>

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

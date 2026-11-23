"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useTiers } from "@/features/membership/hooks/useMembers";
import { useSaveEarnRule } from "../hooks/usePointRules";
import {
  EMPTY_EARN_RULE_FORM,
  earnRuleFormSchema,
  fieldErrors,
  toEarnRuleFormValues,
  toEarnRuleInput,
  type EarnRuleFormValues,
} from "../schemas/pointRuleForms";
import { EARN_RULE_TRIGGER_LABEL, EARN_RULE_TYPE_LABEL, type EarnRule } from "../types/pointRules";
import { ThaiDateRangeInput } from "@/components/form/ThaiDateRangeInput";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

/** Create or edit one earn rule. Fields change with the rule type. */
export function EarnRuleDialog({ rule, open, onClose }: { rule: EarnRule | null; open: boolean; onClose: () => void }) {
  const [values, setValues] = useState<EarnRuleFormValues>(() =>
    rule ? toEarnRuleFormValues(rule) : EMPTY_EARN_RULE_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const tiers = useTiers();
  const save = useSaveEarnRule();

  const set = <K extends keyof EarnRuleFormValues>(key: K, value: EarnRuleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const close = () => {
    save.reset();
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = earnRuleFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    save.mutate({ id: rule?.id, input: toEarnRuleInput(values) }, { onSuccess: close });
  };

  const isBonus = values.type === "bonus_fixed";
  const isCampaign = values.type === "campaign_multiplier";

  return (
    <Modal
      open={open}
      title={rule ? "แก้ไขกติกาการได้แต้ม" : "เพิ่มกติกาการได้แต้ม"}
      description="แต้มที่ได้ = ปัดลง(แต้มต่อรหัส × ตัวคูณระดับ × ตัวคูณแคมเปญ) — แก้กติกาแล้วไม่มีผลกับแต้มที่ได้ไปแล้ว"
      onClose={close}
      footer={
        <>
          <Button variant="outline" type="button" onClick={close} disabled={save.isPending}>
            ยกเลิก
          </Button>
          <Button type="submit" form="earn-rule-form" disabled={save.isPending}>
            {save.isPending ? "กำลังบันทึก…" : "บันทึก"}
          </Button>
        </>
      }
    >
      <form id="earn-rule-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="er-type">ประเภท</Label>
          <Select
            id="er-type"
            value={values.type}
            disabled={Boolean(rule)}
            onChange={(e) => set("type", e.target.value as EarnRuleFormValues["type"])}
          >
            {Object.entries(EARN_RULE_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {values.type === "tier_multiplier" && (
          <div className="space-y-1.5">
            <Label htmlFor="er-tier">ระดับสมาชิก</Label>
            <Select id="er-tier" value={values.tierId} onChange={(e) => set("tierId", e.target.value)}>
              <option value="">เลือกระดับ</option>
              {(tiers.data ?? []).map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.tierId} />
          </div>
        )}

        {!isBonus && (
          <div className="space-y-1.5">
            <Label htmlFor="er-multiplier">ตัวคูณ</Label>
            <Input
              id="er-multiplier"
              inputMode="decimal"
              value={values.multiplier}
              onChange={(e) => set("multiplier", e.target.value)}
            />
            <FieldError message={errors.multiplier} />
          </div>
        )}

        {isBonus && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="er-trigger">เหตุการณ์</Label>
              <Select
                id="er-trigger"
                value={values.trigger}
                onChange={(e) => set("trigger", e.target.value as EarnRuleFormValues["trigger"])}
              >
                <option value="">เลือก</option>
                {Object.entries(EARN_RULE_TRIGGER_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.trigger} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-points">แต้ม</Label>
              <Input id="er-points" inputMode="numeric" value={values.points} onChange={(e) => set("points", e.target.value)} />
              <FieldError message={errors.points} />
            </div>
          </div>
        )}

        {isCampaign && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="er-skus">เฉพาะ SKU (คั่นด้วยจุลภาค, เว้นว่าง = ทุก SKU)</Label>
              <Input id="er-skus" value={values.skuIds} onChange={(e) => set("skuIds", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={values.stackable} onChange={(e) => set("stackable", e.target.checked)} />
              ใช้ซ้อนกับแคมเปญอื่นได้ (คูณรวม)
            </label>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="er-range">ช่วงเวลาที่ใช้กติกา (เว้นว่าง = เริ่มทันที / ไม่มีกำหนด)</Label>
          <ThaiDateRangeInput
            id="er-range"
            withTime
            optional
            emptyStartLabel="ทันที"
            emptyEndLabel="ไม่มีกำหนด"
            value={{ start: values.startAt, end: values.endAt }}
            onChange={(r) => {
              set("startAt", r.start);
              set("endAt", r.end);
            }}
          />
          <FieldError message={errors.endAt} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="er-priority">ลำดับความสำคัญ (มากก่อน)</Label>
            <Input id="er-priority" inputMode="numeric" value={values.priority} onChange={(e) => set("priority", e.target.value)} />
            <FieldError message={errors.priority} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            เปิดใช้งาน
          </label>
        </div>

        {save.error && (
          <p role="alert" className="text-sm text-red-600">
            {save.error.message}
          </p>
        )}
      </form>
    </Modal>
  );
}

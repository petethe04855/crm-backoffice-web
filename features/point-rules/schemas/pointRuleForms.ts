import { z } from "zod";
import type { EarnRule, EarnRuleInput, EarnRuleTrigger, EarnRuleType } from "../types/pointRules";

/**
 * Form values keep what the inputs hold (text, "YYYY-MM-DDTHH:mm" local time).
 * The schemas give fast feedback; backoffice-api still decides every rule.
 */
export interface EarnRuleFormValues {
  type: EarnRuleType;
  tierId: string;
  multiplier: string;
  skuIds: string;
  trigger: EarnRuleTrigger;
  points: string;
  startAt: string;
  endAt: string;
  stackable: boolean;
  priority: string;
  isActive: boolean;
}

export const EMPTY_EARN_RULE_FORM: EarnRuleFormValues = {
  type: "campaign_multiplier",
  tierId: "",
  multiplier: "2",
  skuIds: "",
  trigger: "",
  points: "",
  startAt: "",
  endAt: "",
  stackable: false,
  priority: "0",
  isActive: true,
};

const multiplier = z
  .string()
  .trim()
  .refine((v) => v !== "" && Number.isFinite(Number(v)), "กรอกตัวคูณเป็นตัวเลข")
  .refine((v) => Number(v) > 0 && Number(v) <= 999.999, "ตัวคูณต้องมากกว่า 0 และไม่เกิน 999.999");

export const earnRuleFormSchema = z
  .object({
    type: z.enum(["tier_multiplier", "campaign_multiplier", "bonus_fixed"]),
    tierId: z.string(),
    multiplier: z.string(),
    skuIds: z.string(),
    trigger: z.enum(["", "signup", "birthday", "first_code"]),
    points: z.string(),
    startAt: z.string(),
    endAt: z.string(),
    stackable: z.boolean(),
    priority: z
      .string()
      .trim()
      .refine((v) => /^-?\d+$/.test(v), "ลำดับต้องเป็นจำนวนเต็ม"),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: keyof EarnRuleFormValues, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (v.type === "tier_multiplier") {
      if (!v.tierId) issue("tierId", "เลือกระดับสมาชิก");
    }
    if (v.type !== "bonus_fixed") {
      const r = multiplier.safeParse(v.multiplier);
      if (!r.success) issue("multiplier", r.error.issues[0].message);
    }
    if (v.type === "bonus_fixed") {
      if (!v.trigger) issue("trigger", "เลือกเหตุการณ์ที่ให้แต้ม");
      if (!/^\d+$/.test(v.points.trim()) || Number(v.points) <= 0) issue("points", "แต้มต้องเป็นจำนวนเต็มมากกว่า 0");
    }
    if (v.startAt && v.endAt && v.startAt >= v.endAt) issue("endAt", "เวลาสิ้นสุดต้องหลังเวลาเริ่ม");
  });

export function toEarnRuleFormValues(r: EarnRule): EarnRuleFormValues {
  const local = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return {
    type: r.type,
    tierId: r.tierId ? String(r.tierId) : "",
    multiplier: String(r.multiplier),
    skuIds: r.skuIds.join(", "),
    trigger: r.trigger,
    points: r.points ? String(r.points) : "",
    startAt: local(r.startAt),
    endAt: local(r.endAt),
    stackable: r.stackable,
    priority: String(r.priority),
    isActive: r.isActive,
  };
}

/** Converts valid form values to the API body; fields unused by the type are cleared. */
export function toEarnRuleInput(v: EarnRuleFormValues): EarnRuleInput {
  const isBonus = v.type === "bonus_fixed";
  const isCampaign = v.type === "campaign_multiplier";
  return {
    type: v.type,
    tierId: v.type === "tier_multiplier" && v.tierId ? Number(v.tierId) : null,
    multiplier: isBonus ? 1 : Number(v.multiplier),
    skuIds: isCampaign
      ? v.skuIds
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    trigger: isBonus ? v.trigger : "",
    points: isBonus ? Number(v.points) : 0,
    startAt: v.startAt ? new Date(v.startAt).toISOString() : null,
    endAt: v.endAt ? new Date(v.endAt).toISOString() : null,
    stackable: isCampaign ? v.stackable : false,
    priority: Number(v.priority),
    isActive: v.isActive,
  };
}

/** Flattens Zod issues to { field: message } (first message per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Whole non-negative number in a text field, or a Thai error. */
export function wholeNumberError(v: string, label: string, max: number): string | null {
  const t = v.trim();
  if (!/^\d+$/.test(t)) return `${label}ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป`;
  if (Number(t) > max) return `${label}ต้องไม่เกิน ${max.toLocaleString("th-TH")}`;
  return null;
}

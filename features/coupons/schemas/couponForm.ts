import { z } from "zod";
import type { BenefitType, CodeType, Coupon, CouponChannel, CouponInput, ExpiryMode } from "../types/coupon";

/**
 * Form values keep what the inputs hold (numbers as text, datetimes as
 * "YYYY-MM-DDTHH:mm" local time). The schema gives fast feedback; the API
 * still decides every rule.
 */
export interface CouponFormValues {
  name: string;
  description: string;
  imageUrl: string;
  terms: string;
  benefitType: BenefitType;
  benefitValue: string;
  maxDiscount: string;
  minSpend: string;
  pointsCost: string;
  claimStart: string;
  claimEnd: string;
  expiryMode: ExpiryMode;
  expiresAt: string;
  validDays: string;
  totalQuota: string;
  limitPerMember: string;
  minTierId: string;
  channel: CouponChannel;
  codeType: CodeType;
  sharedCode: string;
}

export const EMPTY_COUPON_FORM: CouponFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  terms: "",
  benefitType: "amount_off",
  benefitValue: "",
  maxDiscount: "",
  minSpend: "0",
  pointsCost: "0",
  claimStart: "",
  claimEnd: "",
  expiryMode: "days_after_claim",
  expiresAt: "",
  validDays: "30",
  totalQuota: "0",
  limitPerMember: "1",
  minTierId: "",
  channel: "store",
  codeType: "unique",
  sharedCode: "",
};

const isNumber = (v: string) => v.trim() !== "" && Number.isFinite(Number(v));
const isWhole = (v: string) => /^\d+$/.test(v.trim());

export const couponFormSchema = z
  .object({
    name: z.string().trim().min(1, "กรอกชื่อคูปอง").max(120, "ชื่อยาวได้ไม่เกิน 120 ตัวอักษร"),
    description: z.string().max(2000, "ยาวได้ไม่เกิน 2,000 ตัวอักษร"),
    imageUrl: z.string(),
    terms: z.string().max(2000, "ยาวได้ไม่เกิน 2,000 ตัวอักษร"),
    benefitType: z.enum(["amount_off", "percent_off", "free_shipping", "free_item"]),
    benefitValue: z.string(),
    maxDiscount: z.string(),
    minSpend: z.string().refine((v) => isNumber(v) && Number(v) >= 0, "ยอดขั้นต่ำต้องเป็นตัวเลขตั้งแต่ 0"),
    pointsCost: z
      .string()
      .refine((v) => isWhole(v) && Number(v) <= 10_000_000, "แต้มต้องเป็นจำนวนเต็ม 0–10,000,000 (0 = แจกฟรี)"),
    claimStart: z.string(),
    claimEnd: z.string(),
    expiryMode: z.enum(["fixed_date", "days_after_claim"]),
    expiresAt: z.string(),
    validDays: z.string(),
    totalQuota: z
      .string()
      .refine((v) => isWhole(v) && Number(v) <= 1_000_000, "โควตาต้องเป็นจำนวนเต็ม 0–1,000,000 (0 = ไม่จำกัด)"),
    limitPerMember: z
      .string()
      .refine((v) => isWhole(v) && Number(v) >= 1 && Number(v) <= 100, "จำกัดต่อคน 1–100"),
    minTierId: z.string(),
    channel: z.enum(["store", "line", "shopee", "tiktok"]),
    codeType: z.enum(["unique", "shared"]),
    sharedCode: z.string(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: keyof CouponFormValues, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (v.benefitType === "amount_off" && !(isNumber(v.benefitValue) && Number(v.benefitValue) > 0)) {
      issue("benefitValue", "กรอกจำนวนเงินที่ลด (มากกว่า 0)");
    }
    if (v.benefitType === "percent_off") {
      if (!(isNumber(v.benefitValue) && Number(v.benefitValue) > 0 && Number(v.benefitValue) <= 100)) {
        issue("benefitValue", "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0–100");
      }
      if (!(isNumber(v.maxDiscount) && Number(v.maxDiscount) > 0)) issue("maxDiscount", "กรอกส่วนลดสูงสุด (บาท)");
    }
    if (v.claimStart && v.claimEnd && v.claimStart >= v.claimEnd) issue("claimEnd", "วันสิ้นสุดต้องหลังวันเริ่ม");
    if (v.expiryMode === "fixed_date") {
      if (!v.expiresAt) issue("expiresAt", "กำหนดวันหมดอายุ");
      else if (v.claimEnd && v.expiresAt < v.claimEnd) issue("expiresAt", "วันหมดอายุต้องไม่ก่อนวันปิดรับแลก");
    } else if (!(isWhole(v.validDays) && Number(v.validDays) >= 1 && Number(v.validDays) <= 365)) {
      issue("validDays", "จำนวนวัน 1–365");
    }
    if ((v.channel === "shopee" || v.channel === "tiktok") && v.codeType !== "shared") {
      issue("codeType", "คูปอง Shopee/TikTok ต้องใช้รหัสร้านร่วม (shared)");
    }
    if (v.codeType === "shared" && !/^[A-Za-z0-9-]{3,40}$/.test(v.sharedCode.trim())) {
      issue("sharedCode", "รหัส 3–40 ตัว (A–Z, 0–9, -)");
    }
  });

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISO = (local: string) => (local ? new Date(local).toISOString() : null);

export function toCouponFormValues(c: Coupon): CouponFormValues {
  return {
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    terms: c.terms,
    benefitType: c.benefitType,
    benefitValue: c.benefitValue ? String(c.benefitValue) : "",
    maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
    minSpend: String(c.minSpend),
    pointsCost: String(c.pointsCost),
    claimStart: toLocalInput(c.claimStartAt),
    claimEnd: toLocalInput(c.claimEndAt),
    expiryMode: c.expiryMode,
    expiresAt: toLocalInput(c.expiresAt),
    validDays: c.validDays ? String(c.validDays) : "30",
    totalQuota: String(c.totalQuota),
    limitPerMember: String(c.limitPerMember),
    minTierId: c.minTierId ? String(c.minTierId) : "",
    channel: c.channel,
    codeType: c.codeType,
    sharedCode: c.sharedCode,
  };
}

/** Converts valid form values to the API body; fields the choices do not use are cleared. */
export function toCouponInput(v: CouponFormValues): CouponInput {
  const hasValue = v.benefitType === "amount_off" || v.benefitType === "percent_off";
  const fixed = v.expiryMode === "fixed_date";
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    imageUrl: v.imageUrl,
    terms: v.terms.trim(),
    benefitType: v.benefitType,
    benefitValue: hasValue ? Number(v.benefitValue) : 0,
    maxDiscount: v.benefitType === "percent_off" ? Number(v.maxDiscount) : null,
    minSpend: Number(v.minSpend),
    pointsCost: Number(v.pointsCost),
    claimStartAt: toISO(v.claimStart),
    claimEndAt: toISO(v.claimEnd),
    expiryMode: v.expiryMode,
    expiresAt: toISO(v.expiresAt),
    validDays: fixed ? 0 : Number(v.validDays),
    totalQuota: Number(v.totalQuota),
    limitPerMember: Number(v.limitPerMember),
    minTierId: v.minTierId ? Number(v.minTierId) : null,
    channel: v.channel,
    codeType: v.codeType,
    sharedCode: v.codeType === "shared" ? v.sharedCode.trim().toUpperCase() : "",
  };
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

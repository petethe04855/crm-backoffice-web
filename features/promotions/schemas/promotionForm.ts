import { z } from "zod";
import type {
  Promotion,
  PromotionCTAType,
  PromotionInput,
  PromotionPlacement,
} from "../types/promotion";

/**
 * The form keeps every value as the input element stores it: datetimes are
 * "YYYY-MM-DDTHH:mm" (browser local time) and numbers are text. toPromotionInput
 * converts them to what the API expects.
 */
export interface PromotionFormValues {
  title: string;
  description: string;
  imageUrl: string;
  placement: PromotionPlacement;
  displayStart: string;
  displayEnd: string;
  ctaType: PromotionCTAType;
  ctaTarget: string;
  tiers: string[];
  newMemberDays: string;
  priority: string;
}

export const EMPTY_PROMOTION_FORM: PromotionFormValues = {
  title: "",
  description: "",
  imageUrl: "",
  placement: "home_banner",
  displayStart: "",
  displayEnd: "",
  ctaType: "none",
  ctaTarget: "",
  tiers: [],
  newMemberDays: "",
  priority: "0",
};

const optionalWholeNumber = (min: number, max: number) =>
  z
    .string()
    .refine((v) => v.trim() === "" || /^\d+$/.test(v.trim()), "ต้องเป็นจำนวนเต็ม")
    .refine(
      (v) => v.trim() === "" || (Number(v) >= min && Number(v) <= max),
      `ต้องอยู่ระหว่าง ${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}`,
    );

/**
 * Mirrors the backend rules (crm-core/usecase/promotion) so the user gets
 * immediate feedback. The API still re-validates everything: drafts may be
 * incomplete, but a window, once started, must be complete and ordered.
 */
export const promotionFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อโปรโมชั่น")
      .max(120, "ชื่อต้องไม่เกิน 120 ตัวอักษร"),
    description: z.string().max(2000, "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร"),
    imageUrl: z.string(),
    placement: z.enum(["home_banner", "promotion_list", "popup"]),
    displayStart: z.string(),
    displayEnd: z.string(),
    ctaType: z.enum(["none", "url", "reward", "coupon"]),
    ctaTarget: z.string(),
    tiers: z.array(z.string()),
    newMemberDays: optionalWholeNumber(1, 3650),
    priority: optionalWholeNumber(0, 9999),
  })
  .superRefine((v, ctx) => {
    if (Boolean(v.displayStart) !== Boolean(v.displayEnd)) {
      ctx.addIssue({
        code: "custom",
        path: [v.displayStart ? "displayEnd" : "displayStart"],
        message: "ต้องระบุทั้งวันเริ่มและวันสิ้นสุด",
      });
    } else if (v.displayStart && v.displayEnd) {
      const start = new Date(v.displayStart);
      const end = new Date(v.displayEnd);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        ctx.addIssue({ code: "custom", path: ["displayStart"], message: "วันเวลาไม่ถูกต้อง" });
      } else if (start >= end) {
        ctx.addIssue({
          code: "custom",
          path: ["displayEnd"],
          message: "วันสิ้นสุดต้องหลังวันเริ่มต้น",
        });
      }
    }

    const target = v.ctaTarget.trim();
    if (v.ctaType === "url" && !target.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["ctaTarget"],
        message: "ลิงก์ต้องเริ่มต้นด้วย https://",
      });
    }
    if ((v.ctaType === "reward" || v.ctaType === "coupon") && target === "") {
      ctx.addIssue({
        code: "custom",
        path: ["ctaTarget"],
        message: v.ctaType === "reward" ? "กรุณาระบุรหัสของรางวัล" : "กรุณาระบุรหัสคูปอง",
      });
    }
  });

/** The first message per form field, for rendering under the inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** "YYYY-MM-DDTHH:mm" in browser local time, or "" when unset. */
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Fills the form from an existing promotion (edit page). */
export function toFormValues(p: Promotion): PromotionFormValues {
  return {
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl,
    placement: p.placement,
    displayStart: toDateTimeLocal(p.displayStartAt),
    displayEnd: toDateTimeLocal(p.displayEndAt),
    ctaType: p.ctaType,
    ctaTarget: p.ctaTarget,
    tiers: p.audience.tiers ?? [],
    newMemberDays: p.audience.newMemberDays === null ? "" : String(p.audience.newMemberDays),
    priority: String(p.priority),
  };
}

/** Converts validated form values into the POST/PATCH body. */
export function toPromotionInput(v: PromotionFormValues): PromotionInput {
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    imageUrl: v.imageUrl.trim(),
    placement: v.placement,
    displayStartAt: v.displayStart ? new Date(v.displayStart).toISOString() : null,
    displayEndAt: v.displayEnd ? new Date(v.displayEnd).toISOString() : null,
    ctaType: v.ctaType,
    ctaTarget: v.ctaType === "none" ? "" : v.ctaTarget.trim(),
    audience: {
      tiers: v.tiers,
      newMemberDays: v.newMemberDays.trim() === "" ? null : Number(v.newMemberDays),
    },
    priority: v.priority.trim() === "" ? 0 : Number(v.priority),
  };
}

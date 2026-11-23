import { z } from "zod";
import type { Reward, RewardInput } from "../types/reward";

/** Form values as the inputs hold them; the API decides every rule. */
export interface RewardFormValues {
  name: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  erpSkuId: string;
  skuCode: string;
  skuName: string;
  qtyPerRedemption: string;
  pointsCost: string;
  stockLimit: string;
  limitPerMember: string;
  minTierId: string;
  availableFrom: string;
  availableTo: string;
  sortOrder: string;
}

export const EMPTY_REWARD_FORM: RewardFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  categoryId: "",
  erpSkuId: "",
  skuCode: "",
  skuName: "",
  qtyPerRedemption: "1",
  pointsCost: "",
  stockLimit: "",
  limitPerMember: "",
  minTierId: "",
  availableFrom: "",
  availableTo: "",
  sortOrder: "0",
};

const whole = (v: string) => /^\d+$/.test(v.trim());
const optionalWhole = (min: number, max: number, msg: string) =>
  z.string().refine((v) => v.trim() === "" || (whole(v) && Number(v) >= min && Number(v) <= max), msg);

export const rewardFormSchema = z
  .object({
    name: z.string().trim().min(1, "กรอกชื่อของรางวัล").max(120, "ยาวได้ไม่เกิน 120 ตัวอักษร"),
    description: z.string().max(2000, "ยาวได้ไม่เกิน 2,000 ตัวอักษร"),
    imageUrl: z.string().trim().min(1, "กรุณาอัปโหลดรูปของรางวัล (สมาชิกเห็นรูปนี้ใน LINE OA)"),
    categoryId: z.string(),
    erpSkuId: z.string().refine((v) => whole(v) && Number(v) > 0, "เลือกสินค้า (SKU) จาก ERP"),
    skuCode: z.string(),
    skuName: z.string(),
    qtyPerRedemption: z.string().refine((v) => whole(v) && Number(v) >= 1 && Number(v) <= 100, "จำนวนต่อการแลก 1–100"),
    pointsCost: z
      .string()
      .refine((v) => whole(v) && Number(v) >= 1 && Number(v) <= 10_000_000, "แต้มที่ใช้แลกต้องเป็นจำนวนเต็ม 1–10,000,000"),
    stockLimit: optionalWhole(0, 1_000_000, "โควตาต้องเป็นจำนวนเต็มตั้งแต่ 0"),
    limitPerMember: optionalWhole(1, 1000, "จำกัดต่อคน 1–1,000"),
    minTierId: z.string(),
    availableFrom: z.string(),
    availableTo: z.string(),
    sortOrder: z.string().refine((v) => /^-?\d+$/.test(v.trim()), "ลำดับต้องเป็นจำนวนเต็ม"),
  })
  .superRefine((v, ctx) => {
    if (v.availableFrom && v.availableTo && v.availableFrom >= v.availableTo) {
      ctx.addIssue({ code: "custom", path: ["availableTo"], message: "วันสิ้นสุดต้องหลังวันเริ่ม" });
    }
  });

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toISO = (local: string) => (local ? new Date(local).toISOString() : null);
const optNumber = (v: string) => (v.trim() === "" ? null : Number(v));

export function toRewardFormValues(r: Reward): RewardFormValues {
  return {
    name: r.name,
    description: r.description,
    imageUrl: r.imageUrl,
    categoryId: r.categoryId ? String(r.categoryId) : "",
    erpSkuId: r.erpSkuId ? String(r.erpSkuId) : "",
    skuCode: r.skuCode,
    skuName: r.skuName,
    qtyPerRedemption: String(r.qtyPerRedemption),
    pointsCost: String(r.pointsCost),
    stockLimit: r.stockLimit != null ? String(r.stockLimit) : "",
    limitPerMember: r.limitPerMember != null ? String(r.limitPerMember) : "",
    minTierId: r.minTierId ? String(r.minTierId) : "",
    availableFrom: toLocalInput(r.availableFrom),
    availableTo: toLocalInput(r.availableTo),
    sortOrder: String(r.sortOrder),
  };
}

export function toRewardInput(v: RewardFormValues): RewardInput {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    imageUrl: v.imageUrl,
    categoryId: optNumber(v.categoryId),
    type: "physical",
    erpSkuId: optNumber(v.erpSkuId),
    skuCode: v.skuCode,
    skuName: v.skuName,
    erpWarehouseId: 1,
    qtyPerRedemption: Number(v.qtyPerRedemption),
    pointsCost: Number(v.pointsCost),
    stockLimit: optNumber(v.stockLimit),
    limitPerMember: optNumber(v.limitPerMember),
    minTierId: optNumber(v.minTierId),
    availableFrom: toISO(v.availableFrom),
    availableTo: toISO(v.availableTo),
    sortOrder: Number(v.sortOrder),
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

/** "5 (ซิงก์ 10:05)" / "ยังไม่ซิงก์" — display only. */
export function describeStock(r: Pick<Reward, "erpAvailableQty" | "stockSyncedAt">): string {
  if (r.erpAvailableQty == null) return "ยังไม่ซิงก์";
  return r.erpAvailableQty.toLocaleString("th-TH");
}

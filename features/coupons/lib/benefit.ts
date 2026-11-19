import { formatThaiDateTime } from "@/lib/utils";
import type { BenefitType, Coupon } from "../types/coupon";

const baht = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

/** "ลด 50 บาท", "ลด 10% สูงสุด 100 บาท", "ส่งฟรี" — display text only. */
export function describeBenefit(c: {
  benefitType: BenefitType | "";
  benefitValue: number;
  maxDiscount: number | null;
  minSpend?: number;
}): string {
  let text: string;
  switch (c.benefitType) {
    case "amount_off":
      text = `ลด ${baht(c.benefitValue)} บาท`;
      break;
    case "percent_off":
      text = `ลด ${baht(c.benefitValue)}%${c.maxDiscount ? ` สูงสุด ${baht(c.maxDiscount)} บาท` : ""}`;
      break;
    case "free_shipping":
      text = "ส่งฟรี";
      break;
    case "free_item":
      text = "รับของแถม";
      break;
    default:
      text = "—";
  }
  if (c.minSpend && c.minSpend > 0) text += ` เมื่อซื้อครบ ${baht(c.minSpend)} บาท`;
  return text;
}

/** "ใช้ได้ 30 วันหลังแลก" or "หมดอายุ 31 ธ.ค. 2569 00:00". */
export function describeExpiry(c: Pick<Coupon, "expiryMode" | "validDays" | "expiresAt">): string {
  if (c.expiryMode === "fixed_date") {
    return c.expiresAt ? `หมดอายุ ${formatThaiDateTime(c.expiresAt)}` : "ยังไม่กำหนดวันหมดอายุ";
  }
  const cap = c.expiresAt ? ` (ไม่เกิน ${formatThaiDateTime(c.expiresAt)})` : "";
  return `ใช้ได้ ${c.validDays} วันหลังแลก${cap}`;
}

/** "3 / 100" or "3 / ไม่จำกัด". */
export function describeQuota(c: Pick<Coupon, "claimedCount" | "totalQuota">): string {
  const total = c.totalQuota > 0 ? c.totalQuota.toLocaleString("th-TH") : "ไม่จำกัด";
  return `${c.claimedCount.toLocaleString("th-TH")} / ${total}`;
}

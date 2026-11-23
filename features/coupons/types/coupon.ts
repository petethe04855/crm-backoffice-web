import type { LineVisibility } from "@/features/line-oa/types/lineVisibility";

/** Mirrors backoffice-api dto/coupon_dto.go. */

export type BenefitType = "amount_off" | "percent_off" | "free_shipping" | "free_item";
export type ExpiryMode = "fixed_date" | "days_after_claim";
export type CouponChannel = "store" | "line" | "shopee" | "tiktok";
export type CodeType = "unique" | "shared";
export type CouponStatus = "draft" | "active" | "paused" | "ended";
export type HolderStatus = "available" | "used" | "expired" | "cancelled";

export interface Coupon {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  terms: string;
  benefitType: BenefitType;
  benefitValue: number;
  maxDiscount: number | null;
  minSpend: number;
  pointsCost: number;
  claimStartAt: string | null;
  claimEndAt: string | null;
  expiryMode: ExpiryMode;
  expiresAt: string | null;
  validDays: number;
  totalQuota: number;
  claimedCount: number;
  usedCount: number;
  /** null = unlimited. */
  remainingQuota: number | null;
  limitPerMember: number;
  minTierId: number | null;
  channel: CouponChannel;
  codeType: CodeType;
  sharedCode: string;
  status: CouponStatus;
  /** Shown in the LINE OA right now (computed by the API). */
  lineVisibility: LineVisibility;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  name: string;
  description: string;
  imageUrl: string;
  terms: string;
  benefitType: BenefitType;
  benefitValue: number;
  maxDiscount: number | null;
  minSpend: number;
  pointsCost: number;
  claimStartAt: string | null;
  claimEndAt: string | null;
  expiryMode: ExpiryMode;
  expiresAt: string | null;
  validDays: number;
  totalQuota: number;
  limitPerMember: number;
  minTierId: number | null;
  channel: CouponChannel;
  codeType: CodeType;
  sharedCode: string;
}

export interface MemberCoupon {
  id: number;
  couponId: number;
  couponName: string;
  benefitType: BenefitType | "";
  memberId: number;
  memberCode: string;
  memberName: string;
  email: string;
  code: string;
  sharedCode: string;
  status: HolderStatus;
  pointsSpent: number;
  claimedAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedRef: string;
  usedByEmail: string;
  cancelledAt: string | null;
  cancelReason: string;
}

export interface CodeView {
  code: string;
  status: HolderStatus;
  usable: boolean;
  reason: "" | "used" | "expired" | "cancelled";
  claimedAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedRef: string;
  coupon: {
    id: number;
    name: string;
    benefitType: BenefitType;
    benefitValue: number;
    maxDiscount: number | null;
    minSpend: number;
    channel: CouponChannel;
    terms: string;
  };
  member: { id: number; memberCode: string; name: string };
}

export interface CouponFilters {
  search: string;
  month: string;
  status: "" | CouponStatus;
  channel: "" | CouponChannel;
  page: number;
  limit: number;
}

export const EMPTY_COUPON_FILTERS: CouponFilters = {
  search: "",
  month: "",
  status: "",
  channel: "",
  page: 1,
  limit: 20,
};

export const BENEFIT_LABEL: Record<BenefitType, string> = {
  amount_off: "ลดเป็นบาท",
  percent_off: "ลดเป็น %",
  free_shipping: "ส่งฟรี",
  free_item: "ของแถม",
};

export const CHANNEL_LABEL: Record<CouponChannel, string> = {
  store: "หน้าร้าน",
  line: "LINE",
  shopee: "Shopee",
  tiktok: "TikTok",
};

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  draft: "ฉบับร่าง",
  active: "เปิดให้แลก",
  paused: "พักไว้",
  ended: "ปิดแล้ว",
};

export const HOLDER_STATUS_LABEL: Record<HolderStatus, string> = {
  available: "ใช้ได้",
  used: "ใช้แล้ว",
  expired: "หมดอายุ",
  cancelled: "ยกเลิก",
};

export const STATUS_VARIANT: Record<CouponStatus | HolderStatus, "default" | "secondary" | "outline" | "subtle" | "destructive"> = {
  draft: "subtle",
  active: "default",
  paused: "secondary",
  ended: "outline",
  available: "default",
  used: "secondary",
  expired: "outline",
  cancelled: "destructive",
};

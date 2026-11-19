/** Where a promotion appears in the LINE app (mirrors crm-core/domain/promotion). */
export type PromotionPlacement = "home_banner" | "promotion_list" | "popup";

/** Draft / published / archived is what staff set; displayStatus is computed. */
export type PromotionStatus = "draft" | "published" | "archived";
export type PromotionDisplayStatus = "draft" | "scheduled" | "live" | "expired" | "archived";

export type PromotionCTAType = "none" | "url" | "reward" | "coupon";

/** Empty tiers with a null newMemberDays means everyone. */
export interface PromotionAudience {
  tiers: string[];
  newMemberDays: number | null;
}

/** One promotion as backoffice-api returns it. */
export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  placement: PromotionPlacement;
  /** RFC3339, or null while a draft has no window yet. */
  displayStartAt: string | null;
  displayEndAt: string | null;
  ctaType: PromotionCTAType;
  ctaTarget: string;
  audience: PromotionAudience;
  priority: number;
  status: PromotionStatus;
  /** Computed by the API from the display window; never stored. */
  displayStatus: PromotionDisplayStatus;
  /** Non-blocking notices (e.g. six home banners at once). */
  warnings: string[];
  createdBy: number;
  createdByEmail: string;
  updatedBy: number;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
}

/** The editable body of POST/PATCH /promotions. */
export interface PromotionInput {
  title: string;
  description: string;
  imageUrl: string;
  placement: PromotionPlacement;
  displayStartAt: string | null;
  displayEndAt: string | null;
  ctaType: PromotionCTAType;
  ctaTarget: string;
  audience: PromotionAudience;
  priority: number;
}

/** List filters. month is YYYY-MM in Thai time; empty means every month. */
export interface PromotionFilters {
  search: string;
  month: string;
  status: "" | PromotionStatus;
  placement: "" | PromotionPlacement;
  page: number;
  limit: number;
}

export const EMPTY_PROMOTION_FILTERS: PromotionFilters = {
  search: "",
  month: "",
  status: "",
  placement: "",
  page: 1,
  limit: 20,
};

export const PLACEMENT_LABEL: Record<PromotionPlacement, string> = {
  home_banner: "แบนเนอร์หน้าแรก",
  promotion_list: "หน้าโปรโมชั่น",
  popup: "ป๊อปอัป",
};

export const PLACEMENTS = Object.keys(PLACEMENT_LABEL) as PromotionPlacement[];

export const CTA_TYPE_LABEL: Record<PromotionCTAType, string> = {
  none: "ไม่มีปุ่ม",
  url: "ลิงก์เว็บ",
  reward: "ไปหน้าของรางวัล",
  coupon: "ไปหน้ารับคูปอง",
};

export const CTA_TYPES = Object.keys(CTA_TYPE_LABEL) as PromotionCTAType[];

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  draft: "ฉบับร่าง",
  published: "เผยแพร่แล้ว",
  archived: "เก็บถาวร",
};

/** What staff see in the status column (plan §3.2). */
export const DISPLAY_STATUS_LABEL: Record<PromotionDisplayStatus, string> = {
  draft: "ฉบับร่าง",
  scheduled: "ตั้งเวลาไว้",
  live: "กำลังแสดง",
  expired: "หมดเวลา",
  archived: "เก็บถาวร",
};

/** Tailwind classes for each computed status. */
export const DISPLAY_STATUS_VARIANT: Record<
  PromotionDisplayStatus,
  "default" | "secondary" | "destructive" | "outline" | "subtle"
> = {
  draft: "subtle",
  scheduled: "outline",
  live: "default",
  expired: "destructive",
  archived: "secondary",
};

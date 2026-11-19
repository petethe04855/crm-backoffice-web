export type MemberStatus = "active" | "suspended" | "deleted";

export interface Tier {
  id: number;
  code: string;
  name: string;
  minSpend: number;
  earnMultiplier: number;
  sortOrder: number;
  isActive: boolean;
}

export interface MemberListItem {
  id: number;
  memberCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  tierCode: string;
  tierName: string;
  pointBalance: number;
  lifetimeSpend: number;
  status: MemberStatus;
  lastActiveAt: string | null;
  registeredAt: string;
}

export interface MemberDetail {
  id: number;
  memberCode: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: "male" | "female" | "other" | "unspecified";
  tier: Tier | null;
  pointBalance: number;
  lifetimeSpend: number;
  erpCustomerId: number | null;
  status: MemberStatus;
  line: {
    lineUserId: string;
    displayName: string;
    pictureUrl: string;
    isFriend: boolean;
    linkedAt: string;
  } | null;
  tags: MemberTag[];
  lastActiveAt: string | null;
  registeredAt: string;
  updatedAt: string;
}

/** Backoffice label (lowercase, unique per member). */
export interface MemberTag {
  tag: string;
  createdAt: string;
}

/** Internal note; never shown to the customer. */
export interface MemberNote {
  id: number;
  body: string;
  createdBy: number;
  createdByEmail: string;
  createdAt: string;
}

export type LedgerType = "earn" | "redeem" | "expire" | "adjust" | "refund" | "reverse";

/** One immutable point movement. `points` is signed. */
export interface PointLedgerEntry {
  id: number;
  type: LedgerType;
  points: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  note: string;
  createdByEmail: string;
  createdAt: string;
}

export const LEDGER_TYPE_LABEL: Record<LedgerType, string> = {
  earn: "ได้รับแต้ม",
  redeem: "แลกแต้ม",
  expire: "แต้มหมดอายุ",
  adjust: "ปรับแต้ม",
  refund: "คืนแต้ม",
  reverse: "ดึงแต้มคืน",
};

/** Filters of the member list. Dates are YYYY-MM-DD (Bangkok), inclusive. */
export interface MemberFilters {
  search: string;
  status: "" | MemberStatus;
  tierId: string;
  registeredFrom: string;
  registeredTo: string;
  /** Inclusive point-balance bounds; empty = no bound. */
  minPoints: string;
  maxPoints: string;
  /** No activity for more than N days; empty = any. */
  inactiveDays: string;
  page: number;
  limit: number;
}

export const EMPTY_MEMBER_FILTERS: MemberFilters = {
  search: "",
  status: "",
  tierId: "",
  registeredFrom: "",
  registeredTo: "",
  minPoints: "",
  maxPoints: "",
  inactiveDays: "",
  page: 1,
  limit: 20,
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  active: "ใช้งาน",
  suspended: "ระงับ",
  deleted: "ลบแล้ว",
};

export const GENDER_LABEL: Record<MemberDetail["gender"], string> = {
  male: "ชาย",
  female: "หญิง",
  other: "อื่น ๆ",
  unspecified: "ไม่ระบุ",
};

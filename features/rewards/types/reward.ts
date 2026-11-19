/** Mirrors backoffice-api dto/reward_dto.go. */

export type RewardStatus = "draft" | "active" | "inactive" | "archived";
export type RedemptionStatus = "pending" | "approved" | "packing" | "shipped" | "delivered" | "cancelled";

export interface RewardCategory {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number | null;
  type: "physical" | "digital" | "privilege";
  erpSkuId: number | null;
  skuCode: string;
  skuName: string;
  erpWarehouseId: number;
  qtyPerRedemption: number;
  pointsCost: number;
  stockLimit: number | null;
  limitPerMember: number | null;
  minTierId: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  status: RewardStatus;
  redeemedCount: number;
  sortOrder: number;
  /** null = never synced from the ERP. */
  erpAvailableQty: number | null;
  stockSyncedAt: string | null;
  stockStale: boolean;
  remainingQuota: number;
  updatedByEmail: string;
  updatedAt: string;
}

export interface RewardInput {
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number | null;
  type: "physical";
  erpSkuId: number | null;
  skuCode: string;
  skuName: string;
  erpWarehouseId: number;
  qtyPerRedemption: number;
  pointsCost: number;
  stockLimit: number | null;
  limitPerMember: number | null;
  minTierId: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  sortOrder: number;
}

export interface ERPSKU {
  id: number;
  code: string;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  availableQty: number;
}

export interface Redemption {
  id: number;
  redemptionNo: string;
  memberId: number;
  memberCode: string;
  memberName: string;
  rewardId: number;
  rewardName: string;
  skuCode: string;
  qty: number;
  points: number;
  status: RedemptionStatus;
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipProvince: string;
  shipPostcode: string;
  memberNote: string;
  trackingNo: string;
  stockIssueRef: string;
  cancelReason: string;
  createdAt: string;
  approvedAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  updatedByEmail: string;
}

export interface RewardFilters {
  search: string;
  categoryId: string;
  status: "" | RewardStatus;
  lowStock: boolean;
  page: number;
  limit: number;
}

export const EMPTY_REWARD_FILTERS: RewardFilters = {
  search: "",
  categoryId: "",
  status: "",
  lowStock: false,
  page: 1,
  limit: 20,
};

export interface RedemptionFilters {
  search: string;
  status: "" | RedemptionStatus;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}

export const EMPTY_REDEMPTION_FILTERS: RedemptionFilters = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 20,
};

export const REWARD_STATUS_LABEL: Record<RewardStatus, string> = {
  draft: "ฉบับร่าง",
  active: "เปิดให้แลก",
  inactive: "ปิดชั่วคราว",
  archived: "เก็บถาวร",
};

export const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  pending: "รอตรวจ",
  approved: "อนุมัติแล้ว",
  packing: "กำลังแพ็ก",
  shipped: "จัดส่งแล้ว",
  delivered: "ได้รับแล้ว",
  cancelled: "ยกเลิก",
};

export const STATUS_VARIANT: Record<RewardStatus | RedemptionStatus, "default" | "secondary" | "outline" | "subtle" | "destructive"> = {
  draft: "subtle",
  active: "default",
  inactive: "secondary",
  archived: "outline",
  pending: "secondary",
  approved: "default",
  packing: "default",
  shipped: "outline",
  delivered: "subtle",
  cancelled: "destructive",
};

/** Next step a staff member can take from each status (the API re-checks). */
export const NEXT_ACTION: Partial<Record<RedemptionStatus, { action: "approve" | "pack" | "ship" | "deliver"; label: string }>> = {
  pending: { action: "approve", label: "อนุมัติ" },
  approved: { action: "pack", label: "เริ่มแพ็ก" },
  packing: { action: "ship", label: "จัดส่ง" },
  shipped: { action: "deliver", label: "ได้รับแล้ว" },
};

export const CANCELLABLE: RedemptionStatus[] = ["pending", "approved", "packing"];

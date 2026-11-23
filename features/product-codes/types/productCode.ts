export type BatchStatus = "draft" | "exported" | "active" | "void";

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  draft: "ร่าง",
  exported: "ส่งออกไฟล์แล้ว",
  active: "เปิดใช้งาน",
  void: "ยกเลิก",
};

export const BATCH_STATUS_VARIANT: Record<BatchStatus, "default" | "secondary" | "outline" | "subtle" | "destructive"> = {
  draft: "subtle",
  exported: "secondary",
  active: "default",
  void: "destructive",
};

export interface BatchStats {
  total: number;
  active: number;
  used: number;
  void: number;
}

export interface ProductCodeBatch {
  id: number;
  batchNo: string;
  erpSkuId: number;
  skuCode: string;
  skuName: string;
  skuPrice: number;
  quantity: number;
  pointsPerCode: number;
  spendValuePerCode: number;
  lotNumber: string;
  lotExpiryDate?: string;
  codeExpiresAt?: string;
  isTest: boolean;
  status: BatchStatus;
  note: string;
  exportedAt?: string;
  activatedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  createdByEmail: string;
  createdAt: string;
  stats: BatchStats;
}

export interface BatchInput {
  erpSkuId: number;
  skuCode: string;
  skuName: string;
  skuPrice: number;
  quantity: number;
  pointsPerCode: number;
  lotNumber: string;
  /** YYYY-MM-DD or "". */
  lotExpiryDate: string;
  /** YYYY-MM-DD or "" (codes valid until the end of that day). */
  codeExpiresAt: string;
  isTest: boolean;
  note: string;
}

export interface BatchFilters {
  search: string;
  status: BatchStatus | "";
  page: number;
}

export type ExportFormat = "xlsx" | "csv";

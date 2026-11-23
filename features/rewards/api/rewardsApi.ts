import { crmClient } from "@/lib/axios";
import { filenameFromDisposition } from "@/features/membership/api/membersApi";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type {
  ERPSKU,
  Redemption,
  RedemptionFilters,
  Reward,
  RewardCategory,
  RewardFilters,
  RewardInput,
  RewardStatus,
} from "../types/reward";

export function buildRewardParams(f: RewardFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { page: f.page, limit: f.limit };
  const search = f.search.trim();
  if (search) params.search = search;
  if (f.categoryId) params.categoryId = f.categoryId;
  if (f.status) params.status = f.status;
  if (f.lowStock) params.lowStock = "true";
  return params;
}

export function buildRedemptionParams(f: RedemptionFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { page: f.page, limit: f.limit };
  const search = f.search.trim();
  if (search) params.search = search;
  if (f.status) params.status = f.status;
  if (f.dateFrom) params.dateFrom = f.dateFrom;
  if (f.dateTo) params.dateTo = f.dateTo;
  return params;
}

export const rewardsApi = {
  async categories(): Promise<RewardCategory[]> {
    const { data } = await crmClient.get<ApiResponse<RewardCategory[]>>("/reward-categories");
    return data.data;
  },
  async createCategory(name: string, sortOrder = 0): Promise<RewardCategory> {
    const { data } = await crmClient.post<ApiResponse<RewardCategory>>("/reward-categories", { name, sortOrder });
    return data.data;
  },
  async deleteCategory(id: number): Promise<void> {
    await crmClient.delete(`/reward-categories/${id}`);
  },

  async list(f: RewardFilters): Promise<ApiListResponse<Reward>> {
    const { data } = await crmClient.get<ApiListResponse<Reward>>("/rewards", { params: buildRewardParams(f) });
    return data;
  },
  async get(id: number): Promise<Reward> {
    const { data } = await crmClient.get<ApiResponse<Reward>>(`/rewards/${id}`);
    return data.data;
  },
  async create(input: RewardInput): Promise<Reward> {
    const { data } = await crmClient.post<ApiResponse<Reward>>("/rewards", input);
    return data.data;
  },
  async update(id: number, input: RewardInput): Promise<Reward> {
    const { data } = await crmClient.patch<ApiResponse<Reward>>(`/rewards/${id}`, input);
    return data.data;
  },
  /** Only a reward nobody redeemed can be deleted (409 otherwise). */
  async remove(id: number): Promise<void> {
    await crmClient.delete(`/rewards/${id}`);
  },
  async setStatus(id: number, status: RewardStatus): Promise<Reward> {
    const { data } = await crmClient.post<ApiResponse<Reward>>(`/rewards/${id}/status`, { status });
    return data.data;
  },
  /** Active ERP SKUs for the reward dropdown (up to 100; search narrows it). */
  async listSKUs(search = ""): Promise<{ items: ERPSKU[]; total: number }> {
    const params: Record<string, string | number> = { limit: 100 };
    if (search.trim()) params.search = search.trim();
    const { data } = await crmClient.get<ApiListResponse<ERPSKU>>("/erp/skus", { params });
    return { items: data.data, total: data.meta.total };
  },

  async redemptions(f: RedemptionFilters): Promise<ApiListResponse<Redemption>> {
    const { data } = await crmClient.get<ApiListResponse<Redemption>>("/redemptions", { params: buildRedemptionParams(f) });
    return data;
  },
  async exportRedemptions(f: RedemptionFilters): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string | number> = { ...buildRedemptionParams(f), format: "xlsx" };
    delete params.page;
    delete params.limit;
    const res = await crmClient.get<Blob>("/redemptions", { params, responseType: "blob", timeout: 120000 });
    return { blob: res.data, filename: filenameFromDisposition(res.headers["content-disposition"], "redemptions.xlsx") };
  },
  async memberRedemptions(memberId: number, page: number, limit: number): Promise<ApiListResponse<Redemption>> {
    const { data } = await crmClient.get<ApiListResponse<Redemption>>(`/members/${memberId}/redemptions`, {
      params: { page, limit },
    });
    return data;
  },
  async transition(
    id: number,
    action: "approve" | "pack" | "ship" | "deliver" | "cancel",
    body?: { trackingNo?: string; reason?: string },
  ): Promise<Redemption> {
    const { data } = await crmClient.post<ApiResponse<Redemption>>(`/redemptions/${id}/${action}`, body ?? {});
    return data.data;
  },
};

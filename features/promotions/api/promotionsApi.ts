import { crmClient } from "@/lib/axios";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type { Promotion, PromotionFilters, PromotionInput } from "../types/promotion";

/** Query params for GET /promotions; empty filters are dropped. */
export function buildPromotionParams(filters: PromotionFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { page: filters.page, limit: filters.limit };
  const search = filters.search.trim();
  if (search) params.search = search;
  if (filters.month) params.month = filters.month;
  if (filters.status) params.status = filters.status;
  if (filters.placement) params.placement = filters.placement;
  return params;
}

export const promotionsApi = {
  async list(filters: PromotionFilters): Promise<ApiListResponse<Promotion>> {
    const { data } = await crmClient.get<ApiListResponse<Promotion>>("/promotions", {
      params: buildPromotionParams(filters),
    });
    return data;
  },

  async get(id: string): Promise<Promotion> {
    const { data } = await crmClient.get<ApiResponse<Promotion>>(`/promotions/${id}`);
    return data.data;
  },

  async create(input: PromotionInput): Promise<Promotion> {
    const { data } = await crmClient.post<ApiResponse<Promotion>>("/promotions", input);
    return data.data;
  },

  async update(id: string, input: PromotionInput): Promise<Promotion> {
    const { data } = await crmClient.patch<ApiResponse<Promotion>>(`/promotions/${id}`, input);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await crmClient.delete(`/promotions/${id}`);
  },

  /** Goes live; the response may carry non-blocking warnings. */
  async publish(id: string): Promise<Promotion> {
    const { data } = await crmClient.post<ApiResponse<Promotion>>(`/promotions/${id}/publish`);
    return data.data;
  },

  async archive(id: string): Promise<Promotion> {
    const { data } = await crmClient.post<ApiResponse<Promotion>>(`/promotions/${id}/archive`);
    return data.data;
  },

  /** Copies the promotion as a new draft titled "<title> (สำเนา)". */
  async duplicate(id: string): Promise<Promotion> {
    const { data } = await crmClient.post<ApiResponse<Promotion>>(`/promotions/${id}/duplicate`);
    return data.data;
  },
};

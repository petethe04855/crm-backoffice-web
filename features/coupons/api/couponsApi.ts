import { crmClient } from "@/lib/axios";
import { filenameFromDisposition } from "@/features/membership/api/membersApi";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type { CodeView, Coupon, CouponFilters, CouponInput, HolderStatus, MemberCoupon } from "../types/coupon";

/** Query params for GET /coupons; empty filters are dropped. */
export function buildCouponParams(f: CouponFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { page: f.page, limit: f.limit };
  const search = f.search.trim();
  if (search) params.search = search;
  if (f.month) params.month = f.month;
  if (f.status) params.status = f.status;
  if (f.channel) params.channel = f.channel;
  return params;
}

export interface HolderQuery {
  status: "" | HolderStatus;
  page: number;
  limit: number;
}

function holderParams(q: HolderQuery): Record<string, string | number> {
  const params: Record<string, string | number> = { page: q.page, limit: q.limit };
  if (q.status) params.status = q.status;
  return params;
}

export const couponsApi = {
  async list(f: CouponFilters): Promise<ApiListResponse<Coupon>> {
    const { data } = await crmClient.get<ApiListResponse<Coupon>>("/coupons", { params: buildCouponParams(f) });
    return data;
  },

  async get(id: number): Promise<Coupon> {
    const { data } = await crmClient.get<ApiResponse<Coupon>>(`/coupons/${id}`);
    return data.data;
  },

  async create(input: CouponInput): Promise<Coupon> {
    const { data } = await crmClient.post<ApiResponse<Coupon>>("/coupons", input);
    return data.data;
  },

  async update(id: number, input: CouponInput): Promise<Coupon> {
    const { data } = await crmClient.patch<ApiResponse<Coupon>>(`/coupons/${id}`, input);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await crmClient.delete(`/coupons/${id}`);
  },

  async transition(id: number, action: "activate" | "pause" | "end"): Promise<Coupon> {
    const { data } = await crmClient.post<ApiResponse<Coupon>>(`/coupons/${id}/${action}`);
    return data.data;
  },

  async holders(id: number, q: HolderQuery): Promise<ApiListResponse<MemberCoupon>> {
    const { data } = await crmClient.get<ApiListResponse<MemberCoupon>>(`/coupons/${id}/holders`, {
      params: holderParams(q),
    });
    return data;
  },

  async exportHolders(id: number): Promise<{ blob: Blob; filename: string }> {
    const res = await crmClient.get<Blob>(`/coupons/${id}/holders`, {
      params: { format: "xlsx" },
      responseType: "blob",
      timeout: 120000,
    });
    return {
      blob: res.data,
      filename: filenameFromDisposition(res.headers["content-disposition"], `coupon-${id}-holders.xlsx`),
    };
  },

  async cancel(memberCouponId: number, reason: string): Promise<MemberCoupon> {
    const { data } = await crmClient.post<ApiResponse<MemberCoupon>>(`/member-coupons/${memberCouponId}/cancel`, {
      reason,
    });
    return data.data;
  },

  async memberCoupons(memberId: number, q: HolderQuery): Promise<ApiListResponse<MemberCoupon>> {
    const { data } = await crmClient.get<ApiListResponse<MemberCoupon>>(`/members/${memberId}/coupons`, {
      params: holderParams(q),
    });
    return data;
  },

  async grant(memberId: number, couponId: number): Promise<MemberCoupon> {
    const { data } = await crmClient.post<ApiResponse<MemberCoupon>>(`/members/${memberId}/coupons`, { couponId });
    return data.data;
  },

  async lookup(code: string): Promise<CodeView> {
    const { data } = await crmClient.get<ApiResponse<CodeView>>(`/coupons/codes/${encodeURIComponent(code)}`);
    return data.data;
  },

  async use(code: string, usedRef: string): Promise<CodeView> {
    const { data } = await crmClient.post<ApiResponse<CodeView>>(`/coupons/codes/${encodeURIComponent(code)}/use`, {
      usedRef,
    });
    return data.data;
  },
};

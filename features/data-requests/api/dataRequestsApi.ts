import { crmClient } from "@/lib/axios";
import type { ApiListResponse } from "@/types/api";

export type DataRequestStatus = "pending" | "completed" | "rejected";

export interface DataRequest {
  id: number;
  memberId: number;
  memberCode: string;
  name: string;
  email: string;
  type: "delete";
  status: DataRequestStatus;
  reason: string;
  staffNote: string;
  processedBy: number;
  processedAt?: string;
  createdAt: string;
}

export const dataRequestsApi = {
  async list(status: DataRequestStatus | "", page: number): Promise<ApiListResponse<DataRequest>> {
    const params: Record<string, string | number> = { page, limit: 20 };
    if (status) params.status = status;
    const { data } = await crmClient.get<ApiListResponse<DataRequest>>("/data-requests", { params });
    return data;
  },
  async complete(id: number, note: string): Promise<void> {
    await crmClient.post(`/data-requests/${id}/complete`, { note });
  },
  async reject(id: number, note: string): Promise<void> {
    await crmClient.post(`/data-requests/${id}/reject`, { note });
  },
};

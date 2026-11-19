import { crmClient } from "@/lib/axios";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type {
  LedgerType,
  MemberDetail,
  MemberFilters,
  MemberListItem,
  MemberNote,
  MemberTag,
  PointLedgerEntry,
  Tier,
} from "../types/member";

export interface LedgerQuery {
  type: "" | LedgerType;
  page: number;
  limit: number;
}

/** Signed: positive grants, negative deducts. */
export interface PointsAdjustInput {
  points: number;
  reason: string;
}

/** Query params for GET /members; empty filters are dropped. */
export function buildMemberParams(filters: MemberFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { page: filters.page, limit: filters.limit };
  const search = filters.search.trim();
  if (search) params.search = search;
  if (filters.status) params.status = filters.status;
  if (filters.tierId) params.tierId = filters.tierId;
  if (filters.registeredFrom) params.registeredFrom = filters.registeredFrom;
  if (filters.registeredTo) params.registeredTo = filters.registeredTo;
  if (filters.minPoints.trim()) params.minPoints = filters.minPoints.trim();
  if (filters.maxPoints.trim()) params.maxPoints = filters.maxPoints.trim();
  if (filters.inactiveDays.trim()) params.inactiveDays = filters.inactiveDays.trim();
  return params;
}

/** Reads the filename from Content-Disposition, falling back to a default. */
export function filenameFromDisposition(header: string | undefined, fallback: string): string {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export const membersApi = {
  async list(filters: MemberFilters): Promise<ApiListResponse<MemberListItem>> {
    const { data } = await crmClient.get<ApiListResponse<MemberListItem>>("/members", {
      params: buildMemberParams(filters),
    });
    return data;
  },

  async get(id: number): Promise<MemberDetail> {
    const { data } = await crmClient.get<ApiResponse<MemberDetail>>(`/members/${id}`);
    return data.data;
  },

  async tiers(): Promise<Tier[]> {
    const { data } = await crmClient.get<ApiResponse<Tier[]>>("/tiers");
    return data.data;
  },

  async ledger(id: number, query: LedgerQuery): Promise<ApiListResponse<PointLedgerEntry>> {
    const params: Record<string, string | number> = { page: query.page, limit: query.limit };
    if (query.type) params.type = query.type;
    const { data } = await crmClient.get<ApiListResponse<PointLedgerEntry>>(`/members/${id}/points`, { params });
    return data;
  },

  async adjustPoints(id: number, input: PointsAdjustInput): Promise<PointLedgerEntry> {
    const { data } = await crmClient.post<ApiResponse<PointLedgerEntry>>(`/members/${id}/points/adjust`, input);
    return data.data;
  },

  async updateStatus(id: number, status: "active" | "suspended"): Promise<MemberDetail> {
    const { data } = await crmClient.patch<ApiResponse<MemberDetail>>(`/members/${id}`, { status });
    return data.data;
  },

  async unlinkLine(id: number): Promise<void> {
    await crmClient.delete(`/members/${id}/line`);
  },

  async tags(id: number): Promise<MemberTag[]> {
    const { data } = await crmClient.get<ApiResponse<MemberTag[]>>(`/members/${id}/tags`);
    return data.data;
  },

  async addTag(id: number, tag: string): Promise<MemberTag[]> {
    const { data } = await crmClient.post<ApiResponse<MemberTag[]>>(`/members/${id}/tags`, { tag });
    return data.data;
  },

  async removeTag(id: number, tag: string): Promise<MemberTag[]> {
    const { data } = await crmClient.delete<ApiResponse<MemberTag[]>>(
      `/members/${id}/tags/${encodeURIComponent(tag)}`,
    );
    return data.data;
  },

  async notes(id: number, page: number, limit = 20): Promise<ApiListResponse<MemberNote>> {
    const { data } = await crmClient.get<ApiListResponse<MemberNote>>(`/members/${id}/notes`, {
      params: { page, limit },
    });
    return data;
  },

  async addNote(id: number, body: string): Promise<MemberNote> {
    const { data } = await crmClient.post<ApiResponse<MemberNote>>(`/members/${id}/notes`, { body });
    return data.data;
  },

  /** Downloads the filtered member list as .xlsx (masked unless owner). */
  async exportXlsx(filters: MemberFilters): Promise<{ blob: Blob; filename: string }> {
    const params = { ...buildMemberParams(filters), format: "xlsx" };
    delete (params as Record<string, unknown>).page;
    delete (params as Record<string, unknown>).limit;
    const res = await crmClient.get<Blob>("/members", { params, responseType: "blob", timeout: 120000 });
    return {
      blob: res.data,
      filename: filenameFromDisposition(res.headers["content-disposition"], "members.xlsx"),
    };
  },
};

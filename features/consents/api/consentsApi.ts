import { crmClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ConsentDocument, ConsentDocumentInput } from "../types/consent";

export const consentsApi = {
  async list(): Promise<ConsentDocument[]> {
    const { data } = await crmClient.get<ApiResponse<ConsentDocument[]>>("/consent-documents");
    return data.data;
  },
  async create(input: ConsentDocumentInput): Promise<ConsentDocument> {
    const { data } = await crmClient.post<ApiResponse<ConsentDocument>>("/consent-documents", input);
    return data.data;
  },
  async setActive({ id, isActive }: { id: number; isActive: boolean }): Promise<ConsentDocument> {
    const { data } = await crmClient.patch<ApiResponse<ConsentDocument>>(`/consent-documents/${id}/active`, { isActive });
    return data.data;
  },
};

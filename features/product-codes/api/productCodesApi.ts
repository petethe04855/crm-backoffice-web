import { isAxiosError } from "axios";
import { crmClient } from "@/lib/axios";
import { filenameFromDisposition } from "@/features/membership/api/membersApi";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type { BatchFilters, BatchInput, ExportFormat, ProductCodeBatch } from "../types/productCode";

/** A failed blob request carries its JSON error inside the Blob. */
async function blobError(error: unknown): Promise<Error> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text()) as { error?: { message?: string } };
      if (body.error?.message) return new Error(body.error.message);
    } catch {
      /* not JSON */
    }
  }
  return error instanceof Error ? error : new Error("ส่งออกไฟล์ไม่สำเร็จ");
}

export const productCodesApi = {
  async list(f: BatchFilters): Promise<ApiListResponse<ProductCodeBatch>> {
    const params: Record<string, string | number> = { page: f.page, limit: 20 };
    if (f.search.trim()) params.search = f.search.trim();
    if (f.status) params.status = f.status;
    const { data } = await crmClient.get<ApiListResponse<ProductCodeBatch>>("/product-code-batches", { params });
    return data;
  },
  async create(input: BatchInput): Promise<ProductCodeBatch> {
    const { data } = await crmClient.post<ApiResponse<ProductCodeBatch>>("/product-code-batches", input);
    return data.data;
  },
  /** Generates the codes and downloads the print file. Works once per batch. */
  async export(id: number, format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    try {
      const res = await crmClient.post<Blob>(`/product-code-batches/${id}/export`, null, {
        params: { format },
        responseType: "blob",
        timeout: 300000,
      });
      return {
        blob: res.data,
        filename: filenameFromDisposition(res.headers["content-disposition"], `batch-${id}-codes.${format}`),
      };
    } catch (error) {
      throw await blobError(error);
    }
  },
  async activate(id: number): Promise<ProductCodeBatch> {
    const { data } = await crmClient.post<ApiResponse<ProductCodeBatch>>(`/product-code-batches/${id}/activate`);
    return data.data;
  },
  async void(id: number, reason: string): Promise<ProductCodeBatch> {
    const { data } = await crmClient.post<ApiResponse<ProductCodeBatch>>(`/product-code-batches/${id}/void`, { reason });
    return data.data;
  },
};

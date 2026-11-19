import { crmClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { UploadedImage } from "../types/upload";

/** Largest image the API accepts (mirrors crm-core/domain/upload). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** MIME types the API stores. The server re-checks the magic bytes. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export const IMAGE_ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export const uploadsApi = {
  /**
   * Uploads one image (multipart field "file") and returns its public URL.
   * The API picks the type from the bytes and the file name is ignored.
   */
  async image(file: File): Promise<UploadedImage> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await crmClient.post<ApiResponse<UploadedImage>>("/uploads/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
};

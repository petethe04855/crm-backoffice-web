"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadsApi } from "../api/uploadsApi";
import type { UploadedImage } from "../types/upload";

/** Uploads one image; the component owns preview and form state. */
export function useUploadImage() {
  return useMutation<UploadedImage, Error, File>({
    mutationFn: (file: File) => uploadsApi.image(file),
  });
}

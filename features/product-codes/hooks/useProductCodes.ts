"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveBlob } from "@/lib/download";
import { productCodesApi } from "../api/productCodesApi";
import type { BatchFilters, ExportFormat } from "../types/productCode";

const key = ["product-code-batches"] as const;

export function useProductCodeBatches(f: BatchFilters) {
  return useQuery({ queryKey: [...key, f], queryFn: () => productCodesApi.list(f), placeholderData: keepPreviousData });
}

export function useProductCodeBatch(id: number) {
  return useQuery({
    queryKey: [...key, "detail", id],
    queryFn: () => productCodesApi.get(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: key });
}

export function useCreateBatch() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: productCodesApi.create, onSuccess: invalidate });
}

export function useUpdateBatch(id: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: Parameters<typeof productCodesApi.update>[1]) => productCodesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useExportBatch() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, format }: { id: number; format: ExportFormat }) => productCodesApi.export(id, format),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, filename);
      invalidate();
    },
  });
}

export function useActivateBatch() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: productCodesApi.activate, onSuccess: invalidate });
}

export function useVoidBatch() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => productCodesApi.void(id, reason),
    onSuccess: invalidate,
  });
}

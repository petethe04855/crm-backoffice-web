"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { promotionsApi } from "../api/promotionsApi";
import type { Promotion, PromotionFilters, PromotionInput } from "../types/promotion";

export const promotionKeys = {
  all: ["promotions"] as const,
  list: (filters: PromotionFilters) => ["promotions", "list", filters] as const,
  detail: (id: string) => ["promotions", "detail", id] as const,
};

export function usePromotionList(filters: PromotionFilters) {
  return useQuery({
    queryKey: promotionKeys.list(filters),
    queryFn: () => promotionsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function usePromotion(id: string) {
  return useQuery({
    queryKey: promotionKeys.detail(id),
    queryFn: () => promotionsApi.get(id),
    enabled: id.length > 0,
  });
}

/** Invalidates every promotion query after a write so the list, calendar and
 * detail page all reflect the new state. */
function usePromotionWrite<TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: promotionKeys.all });
    },
  });
}

export function useCreatePromotion() {
  return usePromotionWrite((input: PromotionInput) => promotionsApi.create(input));
}

export function useUpdatePromotion() {
  return usePromotionWrite(({ id, input }: { id: string; input: PromotionInput }) =>
    promotionsApi.update(id, input),
  );
}

export function useDeletePromotion() {
  return usePromotionWrite((id: string) => promotionsApi.remove(id));
}

/** Resolves to the published promotion, including non-blocking warnings. */
export function usePublishPromotion() {
  return usePromotionWrite((id: string): Promise<Promotion> => promotionsApi.publish(id));
}

export function useArchivePromotion() {
  return usePromotionWrite((id: string) => promotionsApi.archive(id));
}

export function useDuplicatePromotion() {
  return usePromotionWrite((id: string) => promotionsApi.duplicate(id));
}

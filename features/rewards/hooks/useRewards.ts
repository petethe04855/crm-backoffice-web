"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rewardsApi } from "../api/rewardsApi";
import type { RedemptionFilters, RewardFilters, RewardInput, RewardStatus } from "../types/reward";

export const rewardKeys = {
  all: ["rewards"] as const,
  categories: ["rewards", "categories"] as const,
  list: (f: RewardFilters) => ["rewards", "list", f] as const,
  detail: (id: number) => ["rewards", "detail", id] as const,
  skus: (q: string) => ["rewards", "erp-skus", q] as const,
  redemptions: (f: RedemptionFilters) => ["rewards", "redemptions", f] as const,
  member: (id: number, page: number, limit: number) => ["rewards", "member", id, page, limit] as const,
};

export function useRewardCategories() {
  return useQuery({ queryKey: rewardKeys.categories, queryFn: rewardsApi.categories, staleTime: 60_000 });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => rewardsApi.createCategory(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rewardsApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardKeys.categories }),
  });
}

export function useRewardList(f: RewardFilters) {
  return useQuery({ queryKey: rewardKeys.list(f), queryFn: () => rewardsApi.list(f), placeholderData: keepPreviousData });
}

export function useReward(id: number) {
  return useQuery({ queryKey: rewardKeys.detail(id), queryFn: () => rewardsApi.get(id), enabled: id > 0 });
}

export function useSaveReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: RewardInput }) =>
      id ? rewardsApi.update(id, input) : rewardsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardKeys.all }),
  });
}

export function useSetRewardStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: RewardStatus }) => rewardsApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardKeys.all }),
  });
}

/** ERP SKU search for the form; runs only for 2+ characters. */
export function useERPSKUSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: rewardKeys.skus(q),
    queryFn: () => rewardsApi.searchSKUs(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
    retry: false,
  });
}

export function useRedemptionList(f: RedemptionFilters) {
  return useQuery({
    queryKey: rewardKeys.redemptions(f),
    queryFn: () => rewardsApi.redemptions(f),
    placeholderData: keepPreviousData,
  });
}

export function useMemberRedemptions(memberId: number, page: number, limit: number) {
  return useQuery({
    queryKey: rewardKeys.member(memberId, page, limit),
    queryFn: () => rewardsApi.memberRedemptions(memberId, page, limit),
    enabled: memberId > 0,
    placeholderData: keepPreviousData,
  });
}

export function useRedemptionTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      action: "approve" | "pack" | "ship" | "deliver" | "cancel";
      body?: { trackingNo?: string; reason?: string };
    }) => rewardsApi.transition(v.id, v.action, v.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rewardKeys.all });
      // A cancel refunds points.
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

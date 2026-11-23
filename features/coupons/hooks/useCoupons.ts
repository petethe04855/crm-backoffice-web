"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponsApi, type HolderQuery } from "../api/couponsApi";
import type { CouponFilters, CouponInput } from "../types/coupon";

export const couponKeys = {
  all: ["coupons"] as const,
  list: (f: CouponFilters) => ["coupons", "list", f] as const,
  detail: (id: number) => ["coupons", "detail", id] as const,
  holders: (id: number, q: HolderQuery) => ["coupons", "holders", id, q] as const,
  member: (memberId: number, q: HolderQuery) => ["coupons", "member", memberId, q] as const,
};

export function useCouponList(f: CouponFilters) {
  return useQuery({ queryKey: couponKeys.list(f), queryFn: () => couponsApi.list(f), placeholderData: keepPreviousData });
}

export function useCoupon(id: number) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponsApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

/** Every coupon mutation refreshes the whole module (counts move together). */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: couponKeys.all });
}

export function useSaveCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: CouponInput }) =>
      id ? couponsApi.update(id, input) : couponsApi.create(input),
    onSuccess: invalidate,
  });
}

/**
 * Saves the coupon, then activates it so members see it in the LINE OA.
 * The API still validates both steps; an active coupon is only saved.
 */
export function useSaveAndShowCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: CouponInput }) => {
      const saved = id ? await couponsApi.update(id, input) : await couponsApi.create(input);
      if (saved.status === "draft" || saved.status === "paused") {
        return couponsApi.transition(saved.id, "activate");
      }
      return saved;
    },
    onSettled: invalidate,
  });
}

export function useCouponTransition() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: "activate" | "pause" | "end" }) =>
      couponsApi.transition(id, action),
    onSuccess: invalidate,
  });
}

export function useDeleteCoupon() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => couponsApi.remove(id), onSuccess: invalidate });
}

export function useCouponHolders(id: number, q: HolderQuery) {
  return useQuery({
    queryKey: couponKeys.holders(id, q),
    queryFn: () => couponsApi.holders(id, q),
    enabled: id > 0,
    placeholderData: keepPreviousData,
  });
}

export function useCancelMemberCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => couponsApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: couponKeys.all });
      // A refund changes the member's balance and ledger.
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useMemberCoupons(memberId: number, q: HolderQuery) {
  return useQuery({
    queryKey: couponKeys.member(memberId, q),
    queryFn: () => couponsApi.memberCoupons(memberId, q),
    enabled: memberId > 0,
    placeholderData: keepPreviousData,
  });
}

export function useGrantCoupon(memberId: number) {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (couponId: number) => couponsApi.grant(memberId, couponId), onSuccess: invalidate });
}

export function useLookupCoupon() {
  return useMutation({ mutationFn: (code: string) => couponsApi.lookup(code) });
}

export function useUseCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ code, usedRef }: { code: string; usedRef: string }) => couponsApi.use(code, usedRef),
    onSuccess: invalidate,
  });
}

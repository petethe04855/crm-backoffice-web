"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pointRulesApi } from "../api/pointRulesApi";
import type { AdjustPolicy, EarnRuleInput, ExpiryPolicy, RedeemPolicy, SimulateInput } from "../types/pointRules";

export const pointRuleKeys = {
  all: ["point-rules"] as const,
  earnRules: ["point-rules", "earn-rules"] as const,
  redeemPolicy: ["point-rules", "redeem-policy"] as const,
  expiryPolicy: ["point-rules", "expiry-policy"] as const,
  adjustPolicy: ["point-rules", "adjust-policy"] as const,
};

export function useEarnRules() {
  return useQuery({ queryKey: pointRuleKeys.earnRules, queryFn: () => pointRulesApi.earnRules() });
}

export function useSaveEarnRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: EarnRuleInput }) =>
      id ? pointRulesApi.updateEarnRule(id, input) : pointRulesApi.createEarnRule(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: pointRuleKeys.earnRules }),
  });
}

export function useRedeemPolicy() {
  return useQuery({ queryKey: pointRuleKeys.redeemPolicy, queryFn: pointRulesApi.redeemPolicy });
}

export function useSaveRedeemPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: RedeemPolicy) => pointRulesApi.putRedeemPolicy(p),
    onSuccess: (saved) => qc.setQueryData(pointRuleKeys.redeemPolicy, saved),
  });
}

export function useExpiryPolicy() {
  return useQuery({ queryKey: pointRuleKeys.expiryPolicy, queryFn: pointRulesApi.expiryPolicy });
}

export function useSaveExpiryPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ExpiryPolicy) => pointRulesApi.putExpiryPolicy(p),
    onSuccess: (saved) => qc.setQueryData(pointRuleKeys.expiryPolicy, saved),
  });
}

export function useAdjustPolicy() {
  return useQuery({ queryKey: pointRuleKeys.adjustPolicy, queryFn: pointRulesApi.adjustPolicy });
}

export function useSaveAdjustPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: AdjustPolicy) => pointRulesApi.putAdjustPolicy(p),
    onSuccess: (saved) => qc.setQueryData(pointRuleKeys.adjustPolicy, saved),
  });
}

export function useSimulatePoints() {
  return useMutation({ mutationFn: (input: SimulateInput) => pointRulesApi.simulate(input) });
}

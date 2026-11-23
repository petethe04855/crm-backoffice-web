"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { codeControlApi } from "../api/codeControlApi";

const policyKey = ["product-code-policy"] as const;
const testersKey = ["test-members"] as const;

export function useCodePolicy() {
  return useQuery({ queryKey: policyKey, queryFn: codeControlApi.policy });
}

export function useSaveCodePolicy() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: codeControlApi.putPolicy, onSuccess: (p) => qc.setQueryData(policyKey, p) });
}

export function useFlaggedMembers() {
  return useQuery({ queryKey: ["product-code-flags"], queryFn: codeControlApi.flagged, refetchInterval: 60_000 });
}

export function useTestMembers() {
  return useQuery({ queryKey: testersKey, queryFn: codeControlApi.testMembers });
}

export function useAddTestMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: codeControlApi.addTestMember, onSuccess: () => qc.invalidateQueries({ queryKey: testersKey }) });
}

export function useRemoveTestMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: codeControlApi.removeTestMember, onSuccess: () => qc.invalidateQueries({ queryKey: testersKey }) });
}

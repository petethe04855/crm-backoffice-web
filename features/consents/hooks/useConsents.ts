"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { consentsApi } from "../api/consentsApi";

const key = ["consent-documents"] as const;

export function useConsentDocuments() {
  return useQuery({ queryKey: key, queryFn: consentsApi.list });
}

export function useCreateConsentDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: consentsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}

export function useSetConsentActive() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: consentsApi.setActive, onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}

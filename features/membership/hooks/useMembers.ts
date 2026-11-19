"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { saveBlob } from "@/lib/download";
import { membersApi } from "../api/membersApi";
import type { MemberFilters } from "../types/member";

export const memberKeys = {
  all: ["members"] as const,
  list: (filters: MemberFilters) => ["members", "list", filters] as const,
  detail: (id: number) => ["members", "detail", id] as const,
  ledger: (id: number, type: string, page: number, limit: number) => ["members", "ledger", id, type, page, limit] as const,
  notes: (id: number, page: number) => ["members", "notes", id, page] as const,
  tiers: ["tiers"] as const,
};

export function useMemberList(filters: MemberFilters) {
  return useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: () => membersApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => membersApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useTiers() {
  return useQuery({ queryKey: memberKeys.tiers, queryFn: membersApi.tiers, staleTime: 5 * 60 * 1000 });
}

/** Downloads the member export and triggers a browser save. */
export function useExportMembers() {
  return useMutation({
    mutationFn: (filters: MemberFilters) => membersApi.exportXlsx(filters),
    onSuccess: ({ blob, filename }) => saveBlob(blob, filename),
  });
}

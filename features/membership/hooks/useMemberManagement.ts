"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi, type LedgerQuery, type PointsAdjustInput } from "../api/membersApi";
import { memberKeys } from "./useMembers";

/** Member statement with paging and a type filter. */
export function useMemberLedger(id: number, query: LedgerQuery) {
  return useQuery({
    queryKey: memberKeys.ledger(id, query.type, query.page, query.limit),
    queryFn: () => membersApi.ledger(id, query),
    enabled: Number.isInteger(id) && id > 0,
    placeholderData: keepPreviousData,
  });
}

export function useMemberNotes(id: number, page: number) {
  return useQuery({
    queryKey: memberKeys.notes(id, page),
    queryFn: () => membersApi.notes(id, page),
    enabled: Number.isInteger(id) && id > 0,
    placeholderData: keepPreviousData,
  });
}

export function useAdjustPoints(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PointsAdjustInput) => membersApi.adjustPoints(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["members", "ledger", id] });
      qc.invalidateQueries({ queryKey: ["members", "list"] });
    },
  });
}

export function useUpdateMemberStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: "active" | "suspended") => membersApi.updateStatus(id, status),
    onSuccess: (updated) => {
      qc.setQueryData(memberKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: ["members", "list"] });
    },
  });
}

export function useUnlinkLine(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => membersApi.unlinkLine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.detail(id) });
    },
  });
}

export function useAddTag(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => membersApi.addTag(id, tag),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.detail(id) }),
  });
}

export function useRemoveTag(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => membersApi.removeTag(id, tag),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.detail(id) }),
  });
}

export function useAddNote(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => membersApi.addNote(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", "notes", id] }),
  });
}

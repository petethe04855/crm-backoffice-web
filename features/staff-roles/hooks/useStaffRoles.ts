"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffRolesApi } from "../api/staffRolesApi";

const key = ["staff-roles"] as const;

export function useStaffRoles() {
  return useQuery({ queryKey: key, queryFn: staffRolesApi.list });
}

export function useGrantStaffRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: staffRolesApi.grant, onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}

export function useRevokeStaffRole() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: staffRolesApi.revoke, onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { salesDashboardApi } from "../api/salesDashboardApi";
import type { SalesFilters } from "../types/salesDashboard";

export const salesDashboardKeys = {
  all: ["sales-dashboard"] as const,
  report: (filters: SalesFilters) => [...salesDashboardKeys.all, "report", filters] as const,
  members: (from: string, to: string) => [...salesDashboardKeys.all, "members", from, to] as const,
  customer: (platform: string, buyer: string, filters: SalesFilters) =>
    [...salesDashboardKeys.all, "customer", platform, buyer, filters] as const,
};

/** Whole dashboard for the active filter. Keeps the previous payload while the next loads. */
export function useSalesDashboard(filters: SalesFilters, enabled = true) {
  return useQuery({
    queryKey: salesDashboardKeys.report(filters),
    queryFn: () => salesDashboardApi.report(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Drill-down of one buyer; only mounted for staff with sales_dashboard.customers. */
export function useCustomerDetail(platform: string, buyer: string, filters: SalesFilters) {
  return useQuery({
    queryKey: salesDashboardKeys.customer(platform, buyer, filters),
    queryFn: () => salesDashboardApi.customerDetail(platform, buyer, filters),
    enabled: platform !== "" && buyer !== "",
    placeholderData: keepPreviousData,
  });
}

/** CRM member report for the dashboard date range. */
export function useMemberReport(filters: SalesFilters) {
  return useQuery({
    queryKey: salesDashboardKeys.members(filters.dateFrom, filters.dateTo),
    queryFn: () => salesDashboardApi.memberReport(filters),
    placeholderData: keepPreviousData,
  });
}

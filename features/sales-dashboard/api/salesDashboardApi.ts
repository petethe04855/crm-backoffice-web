import { crmClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import { filenameFromDisposition } from "@/features/membership/api/membersApi";
import type { MemberReport, SalesCustomerDetail, SalesFilters, SalesReport } from "../types/salesDashboard";

/**
 * Query params for GET /sales-dashboard. "all" and an empty region are the
 * server defaults, so they are dropped instead of being sent back verbatim.
 */
export function buildSalesParams(filters: SalesFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.channel && filters.channel !== "all") params.channel = filters.channel;
  if (filters.region) params.region = filters.region;
  return params;
}

/** Dashboard sections the API can export as .xlsx (one per tab). */
export type SalesExportSection = "summary" | "products" | "provinces" | "customers" | "timing" | "repurchase";

export const salesDashboardApi = {
  /** One tab as .xlsx with the screen's filters (buyers masked unless owner). */
  async exportSection(section: SalesExportSection, filters: SalesFilters): Promise<{ blob: Blob; filename: string }> {
    const res = await crmClient.get<Blob>(`/sales-dashboard/${section}`, {
      params: { ...buildSalesParams(filters), format: "xlsx" },
      responseType: "blob",
      timeout: 120000,
    });
    return {
      blob: res.data,
      filename: filenameFromDisposition(res.headers["content-disposition"], `sales-${section}.xlsx`),
    };
  },

  /** CRM member report for the same date range (channel/region do not apply). */
  async memberReport(filters: SalesFilters): Promise<MemberReport> {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    const { data } = await crmClient.get<ApiResponse<MemberReport>>("/reports/members", { params });
    return data.data;
  },

  /** Whole dashboard payload for one filter set. */
  async report(filters: SalesFilters): Promise<SalesReport> {
    const { data } = await crmClient.get<ApiResponse<SalesReport>>("/sales-dashboard", {
      params: buildSalesParams(filters),
    });
    return data.data;
  },

  /** One buyer's orders inside the active filter window. */
  async customerDetail(platform: string, buyer: string, filters: SalesFilters): Promise<SalesCustomerDetail> {
    const path = `/sales-dashboard/customers/${encodeURIComponent(platform)}/${encodeURIComponent(buyer)}`;
    const { data } = await crmClient.get<ApiResponse<SalesCustomerDetail>>(path, {
      params: buildSalesParams(filters),
    });
    return data.data;
  },
};

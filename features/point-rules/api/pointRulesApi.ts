import { crmClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  AdjustPolicy,
  EarnRule,
  EarnRuleInput,
  EarnRuleType,
  ExpiryPolicy,
  RedeemPolicy,
  SimulateInput,
  SimulateResult,
} from "../types/pointRules";

export const pointRulesApi = {
  async earnRules(type?: EarnRuleType): Promise<EarnRule[]> {
    const { data } = await crmClient.get<ApiResponse<EarnRule[]>>("/earn-rules", {
      params: type ? { type } : undefined,
    });
    return data.data;
  },

  async createEarnRule(input: EarnRuleInput): Promise<EarnRule> {
    const { data } = await crmClient.post<ApiResponse<EarnRule>>("/earn-rules", input);
    return data.data;
  },

  async updateEarnRule(id: number, input: EarnRuleInput): Promise<EarnRule> {
    const { data } = await crmClient.patch<ApiResponse<EarnRule>>(`/earn-rules/${id}`, input);
    return data.data;
  },

  async redeemPolicy(): Promise<RedeemPolicy> {
    const { data } = await crmClient.get<ApiResponse<RedeemPolicy>>("/settings/redeem-policy");
    return data.data;
  },

  async putRedeemPolicy(policy: RedeemPolicy): Promise<RedeemPolicy> {
    const { data } = await crmClient.put<ApiResponse<RedeemPolicy>>("/settings/redeem-policy", policy);
    return data.data;
  },

  async expiryPolicy(): Promise<ExpiryPolicy> {
    const { data } = await crmClient.get<ApiResponse<ExpiryPolicy>>("/settings/point-expiry");
    return data.data;
  },

  async putExpiryPolicy(policy: ExpiryPolicy): Promise<ExpiryPolicy> {
    const { data } = await crmClient.put<ApiResponse<ExpiryPolicy>>("/settings/point-expiry", policy);
    return data.data;
  },

  async adjustPolicy(): Promise<AdjustPolicy> {
    const { data } = await crmClient.get<ApiResponse<AdjustPolicy>>("/settings/point-adjust-policy");
    return data.data;
  },

  async putAdjustPolicy(policy: AdjustPolicy): Promise<AdjustPolicy> {
    const { data } = await crmClient.put<ApiResponse<AdjustPolicy>>("/settings/point-adjust-policy", policy);
    return data.data;
  },

  /** The calculator: the backend computes, the page only displays. */
  async simulate(input: SimulateInput): Promise<SimulateResult> {
    const { data } = await crmClient.post<ApiResponse<SimulateResult>>("/point-rules/simulate", input);
    return data.data;
  },
};

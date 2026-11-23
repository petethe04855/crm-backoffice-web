import { crmClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export interface CodePolicy {
  dailyQuota: number;
  wrongPerHour: number;
  wrongPerDay: number;
}

export interface FlaggedMember {
  memberId: number;
  memberCode: string;
  name: string;
  wrong: number;
  lastAt: string;
}

export interface TestMember {
  memberId: number;
  memberCode: string;
  name: string;
  email: string;
  addedAt: string;
}

export const codeControlApi = {
  async policy(): Promise<CodePolicy> {
    const { data } = await crmClient.get<ApiResponse<CodePolicy>>("/product-code-policy");
    return data.data;
  },
  async putPolicy(p: CodePolicy): Promise<CodePolicy> {
    const { data } = await crmClient.put<ApiResponse<CodePolicy>>("/product-code-policy", p);
    return data.data;
  },
  async flagged(): Promise<FlaggedMember[]> {
    const { data } = await crmClient.get<ApiResponse<FlaggedMember[]>>("/product-code-flags");
    return data.data;
  },
  async testMembers(): Promise<TestMember[]> {
    const { data } = await crmClient.get<ApiResponse<TestMember[]>>("/test-members");
    return data.data;
  },
  async addTestMember(memberId: number): Promise<void> {
    await crmClient.put(`/test-members/${memberId}`);
  },
  async removeTestMember(memberId: number): Promise<void> {
    await crmClient.delete(`/test-members/${memberId}`);
  },
};

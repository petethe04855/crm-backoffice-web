/** Mirrors backoffice-api dto/point_rules_dto.go and crm-core usecase/points. */

export type EarnRuleType = "tier_multiplier" | "campaign_multiplier" | "bonus_fixed";
export type EarnRuleTrigger = "" | "signup" | "birthday" | "first_code";

export interface EarnRule {
  id: number;
  type: EarnRuleType;
  tierId: number | null;
  multiplier: number;
  skuIds: string[];
  trigger: EarnRuleTrigger;
  points: number;
  startAt: string | null;
  endAt: string | null;
  stackable: boolean;
  priority: number;
  isActive: boolean;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /earn-rules and PATCH /earn-rules/:id (PATCH replaces every field). */
export interface EarnRuleInput {
  type: EarnRuleType;
  tierId: number | null;
  multiplier: number;
  skuIds: string[];
  trigger: EarnRuleTrigger;
  points: number;
  startAt: string | null;
  endAt: string | null;
  stackable: boolean;
  priority: number;
  isActive: boolean;
}

export interface RedeemPolicy {
  minBalanceToRedeem: number;
  minMemberAgeDays: number;
  maxRedemptionsPerDay: number;
  requireEmailVerified: boolean;
  allowedStatuses: string[];
}

export interface ExpiryPolicy {
  mode: "rolling_months";
  months: number;
}

export interface AdjustPolicy {
  maxPerAdjust: number;
  maxPerDay: number;
}

export interface SimulateInput {
  tierId: number;
  skuId: string;
  basePoints: number;
  at: string | null;
}

export interface SimulateResult {
  points: number;
  rules: { id: number; type: EarnRuleType; multiplier: number }[];
}

export const EARN_RULE_TYPE_LABEL: Record<EarnRuleType, string> = {
  tier_multiplier: "ตัวคูณตามระดับ",
  campaign_multiplier: "แคมเปญตัวคูณ",
  bonus_fixed: "แต้มพิเศษครั้งเดียว",
};

export const EARN_RULE_TRIGGER_LABEL: Record<Exclude<EarnRuleTrigger, "">, string> = {
  signup: "สมัครสมาชิก",
  birthday: "เดือนเกิด",
  first_code: "กรอกรหัสครั้งแรก",
};

/** Member statuses a redeem policy may allow (crm-core domain/member). */
export const REDEEM_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "ใช้งาน" },
  { value: "suspended", label: "ระงับ" },
];

"use client";

import { useState } from "react";
import { PublicStatusBadge } from "@/components/common/PublicStatusBadge";
import { PublicToggle } from "@/components/common/PublicToggle";
import { PUBLIC_STATUS_LABEL } from "@/lib/publicStatus";
import { useSetRewardStatus } from "../hooks/useRewards";
import { toRewardPublicStatus, type Reward } from "../types/reward";

/**
 * Status column of the rewards table: one switch that opens / closes the reward
 * in the LINE OA catalogue. Archived rewards are read-only.
 */
export function RewardPublicSwitch({
  reward,
  canManage,
}: {
  reward: Reward;
  canManage: boolean;
}) {
  const status = useSetRewardStatus();
  const [error, setError] = useState<string | null>(null);

  const publicStatus = toRewardPublicStatus(reward.status);
  const checked = publicStatus === "public";
  const archived = reward.status === "archived";

  if (!canManage || archived) {
    return <PublicStatusBadge status={publicStatus} />;
  }

  const toggle = async (next: boolean) => {
    setError(null);
    try {
      await status.mutateAsync({
        id: reward.id,
        status: next ? "active" : "inactive",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  return (
    <PublicToggle
      checked={checked}
      label={PUBLIC_STATUS_LABEL[publicStatus]}
      pending={status.isPending}
      onChange={toggle}
      titleOn="กดเพื่อเปิดให้แลก (public)"
      titleOff="กดเพื่อปิด (unpublic)"
      error={error}
    />
  );
}
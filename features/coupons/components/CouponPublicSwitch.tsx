"use client";

import { useState } from "react";
import { PublicStatusBadge } from "@/components/common/PublicStatusBadge";
import { PublicToggle } from "@/components/common/PublicToggle";
import { PUBLIC_STATUS_LABEL } from "@/lib/publicStatus";
import { useCouponTransition } from "../hooks/useCoupons";
import { toCouponPublicStatus, type Coupon } from "../types/coupon";

/**
 * Status column of the coupons table: one switch that activates or pauses the
 * coupon. An ended coupon cannot be reopened, so it stays read-only.
 */
export function CouponPublicSwitch({
  coupon,
  canManage,
}: {
  coupon: Coupon;
  canManage: boolean;
}) {
  const transition = useCouponTransition();
  const [error, setError] = useState<string | null>(null);

  const publicStatus = toCouponPublicStatus(coupon.status);
  const checked = publicStatus === "public";
  const ended = coupon.status === "ended";

  if (!canManage || ended) {
    return <PublicStatusBadge status={publicStatus} />;
  }

  const toggle = async (next: boolean) => {
    setError(null);
    try {
      await transition.mutateAsync({
        id: coupon.id,
        action: next ? "activate" : "pause",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  return (
    <PublicToggle
      checked={checked}
      label={PUBLIC_STATUS_LABEL[publicStatus]}
      pending={transition.isPending}
      onChange={toggle}
      titleOn="กดเพื่อเปิดให้แลก (public)"
      titleOff="กดเพื่อพักไว้ (unpublic)"
      error={error}
    />
  );
}
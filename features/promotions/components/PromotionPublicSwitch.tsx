"use client";

import { useState } from "react";
import { PublicStatusBadge } from "@/components/common/PublicStatusBadge";
import { PublicToggle } from "@/components/common/PublicToggle";
import { PUBLIC_STATUS_LABEL } from "@/lib/publicStatus";
import {
  usePublishPromotion,
  useUnpublishPromotion,
} from "../hooks/usePromotions";
import { toPublicStatus, type Promotion } from "../types/promotion";

/**
 * Status column control: a switch that publishes / unpublishes the promotion.
 * The public/unpublic text buttons live on the edit page; the table only needs
 * this toggle.
 */
export function PromotionPublicSwitch({
  promotion,
  canManage,
}: {
  promotion: Promotion;
  canManage: boolean;
}) {
  const publish = usePublishPromotion();
  const unpublish = useUnpublishPromotion();
  const [error, setError] = useState<string | null>(null);

  const status = toPublicStatus(promotion.status);
  const checked = status === "public";
  const archived = promotion.status === "archived";
  const pending = publish.isPending || unpublish.isPending;

  if (!canManage || archived) {
    return <PublicStatusBadge status={status} />;
  }

  const toggle = async (next: boolean) => {
    setError(null);
    try {
      await (next ? publish : unpublish).mutateAsync(promotion.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  return (
    <PublicToggle
      checked={checked}
      label={PUBLIC_STATUS_LABEL[status]}
      pending={pending}
      onChange={toggle}
      titleOn="กดเพื่อตั้งเป็น public"
      titleOff="กดเพื่อตั้งเป็น unpublic"
      error={error}
    />
  );
}
"use client";

import { PublicStatusBadge } from "@/components/common/PublicStatusBadge";
import type { PromotionPublicStatus } from "../types/promotion";

/** The promotions table only shows public / unpublic (no draft or archive). */
export function PromotionPublicStatusBadge({
  status,
}: {
  status: PromotionPublicStatus;
}) {
  return <PublicStatusBadge status={status} />;
}
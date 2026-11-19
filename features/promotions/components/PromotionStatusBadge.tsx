"use client";

import { Badge } from "@/components/ui/badge";
import {
  DISPLAY_STATUS_LABEL,
  DISPLAY_STATUS_VARIANT,
  type PromotionDisplayStatus,
} from "../types/promotion";

/** Shows the API-computed display status; the UI never derives it locally. */
export function PromotionStatusBadge({ status }: { status: PromotionDisplayStatus }) {
  return <Badge variant={DISPLAY_STATUS_VARIANT[status]}>{DISPLAY_STATUS_LABEL[status]}</Badge>;
}

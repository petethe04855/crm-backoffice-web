"use client";

import { Badge } from "@/components/ui/badge";
import {
  PUBLIC_STATUS_LABEL,
  PUBLIC_STATUS_VARIANT,
  type PublicStatus,
} from "@/lib/publicStatus";

/** Read-only public / unpublic pill, used when the row cannot be toggled. */
export function PublicStatusBadge({ status }: { status: PublicStatus }) {
  return (
    <Badge variant={PUBLIC_STATUS_VARIANT[status]}>
      {PUBLIC_STATUS_LABEL[status]}
    </Badge>
  );
}
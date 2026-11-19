import { Badge } from "@/components/ui/badge";
import { MEMBER_STATUS_LABEL, type MemberStatus } from "../types/member";

const VARIANT: Record<MemberStatus, "secondary" | "outline" | "subtle"> = {
  active: "secondary",
  suspended: "outline",
  deleted: "subtle",
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return <Badge variant={VARIANT[status] ?? "subtle"}>{MEMBER_STATUS_LABEL[status] ?? status}</Badge>;
}

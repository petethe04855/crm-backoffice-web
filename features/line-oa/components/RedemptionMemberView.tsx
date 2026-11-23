import { CheckCheck, Clock, MessageSquareOff, XCircle } from "lucide-react";
import { cn, formatThaiDateTime } from "@/lib/utils";
import {
  MEMBER_REDEMPTION_STATUS_TEXT,
  type LineDelivery,
  type RedemptionLineMessages,
} from "../types/lineVisibility";

function Delivery({ label, d }: { label: string; d: LineDelivery | null | undefined }) {
  if (!d) {
    return (
      <span className="inline-flex items-center gap-1 text-neutral-400" title="ไม่ได้ส่ง — สมาชิกไม่ได้ผูก LINE หรือยังไม่ถึงขั้นนี้">
        <MessageSquareOff aria-hidden="true" className="h-3.5 w-3.5" />
        {label}: ไม่ได้ส่ง
      </span>
    );
  }
  if (d.status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-green-700" title={d.sentAt ? `ส่งเมื่อ ${formatThaiDateTime(d.sentAt)}` : undefined}>
        <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
        {label}: ส่งแล้ว
      </span>
    );
  }
  if (d.status === "dead") {
    return (
      <span className="inline-flex items-center gap-1 text-red-600" title="ส่งไม่สำเร็จ — สมาชิกอาจบล็อก OA">
        <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
        {label}: ส่งไม่สำเร็จ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-700" title={`เข้าคิวเมื่อ ${formatThaiDateTime(d.queuedAt)}`}>
      <Clock aria-hidden="true" className="h-3.5 w-3.5" />
      {label}: รอส่ง
    </span>
  );
}

/**
 * What the member sees for a redemption in the LINE OA (/redemptions in LIFF)
 * and which LINE messages reached them.
 */
export function RedemptionMemberView({
  status,
  trackingNo,
  cancelReason,
  lineMessages,
}: {
  status: keyof typeof MEMBER_REDEMPTION_STATUS_TEXT;
  trackingNo: string;
  cancelReason: string;
  lineMessages?: RedemptionLineMessages;
}) {
  const shippedStage = status === "shipped" || status === "delivered";
  return (
    <div className="space-y-0.5 text-xs">
      <p className={cn("font-medium", status === "cancelled" ? "text-red-600" : "text-neutral-800")}>
        {MEMBER_REDEMPTION_STATUS_TEXT[status] ?? status}
        {status === "cancelled" && " (คืนแต้มแล้ว)"}
      </p>
      {trackingNo && <p className="text-neutral-600">เลขพัสดุ {trackingNo}</p>}
      {status === "cancelled" && cancelReason && <p className="text-neutral-600">เหตุผล: {cancelReason}</p>}
      {lineMessages && (
        <div className="flex flex-col gap-0.5 pt-0.5">
          <Delivery label="LINE แลกสำเร็จ" d={lineMessages.redeemed} />
          {shippedStage && <Delivery label="LINE จัดส่ง" d={lineMessages.shipped} />}
        </div>
      )}
    </div>
  );
}

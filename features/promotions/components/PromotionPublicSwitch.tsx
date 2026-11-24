"use client";

import { PublicStatusBadge } from "@/components/common/PublicStatusBadge";
import { PublicToggle } from "@/components/common/PublicToggle";
import { toast } from "@/components/common/Toaster";
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
/**
 * Why the promotion cannot go public yet, in Thai, or null when it can.
 * Mirrors the API's publish rules so staff get the reason before the request.
 */
export function publishBlocker(
  p: Pick<Promotion, "title" | "imageUrl" | "displayStartAt" | "displayEndAt">,
  now: Date = new Date(),
): string | null {
  if (!p.displayStartAt || !p.displayEndAt) {
    return `"${p.title}" ยังไม่ได้ตั้งช่วงวัน-เวลาแสดงผล — แก้ไขโปรแล้วตั้งวันเริ่มและวันสิ้นสุดก่อนเปิดแสดงใน LINE OA`;
  }
  if (new Date(p.displayEndAt).getTime() <= now.getTime()) {
    return `"${p.title}" หมดเวลาแสดงแล้ว — แก้วันสิ้นสุดให้เป็นอนาคตก่อนเปิดแสดงใน LINE OA`;
  }
  if (!p.imageUrl.trim()) {
    return `"${p.title}" ยังไม่มีรูปแบนเนอร์ — อัปโหลดรูปก่อนเปิดแสดงใน LINE OA`;
  }
  return null;
}

/** Thai text for the API's publish refusals; other messages pass through. */
export function publishErrorMessage(message: string, title: string): string {
  if (message.includes("display window is required")) {
    return `"${title}" ยังไม่ได้ตั้งช่วงวัน-เวลาแสดงผล — แก้ไขโปรแล้วตั้งวันเริ่มและวันสิ้นสุดก่อนเปิดแสดงใน LINE OA`;
  }
  if (message.includes("displayEndAt: must be in the future")) {
    return `"${title}" หมดเวลาแสดงแล้ว — แก้วันสิ้นสุดให้เป็นอนาคตก่อนเปิดแสดงใน LINE OA`;
  }
  if (message.includes("displayEndAt: must be after displayStartAt")) {
    return `"${title}" วันสิ้นสุดต้องอยู่หลังวันเริ่ม`;
  }
  if (message.includes("imageUrl")) {
    return `"${title}" ยังไม่มีรูปแบนเนอร์ — อัปโหลดรูปก่อนเปิดแสดงใน LINE OA`;
  }
  if (message.includes("title")) return "ต้องมีชื่อโปรโมชั่นก่อนเปิดแสดงใน LINE OA";
  return message;
}

export function PromotionPublicSwitch({
  promotion,
  canManage,
}: {
  promotion: Promotion;
  canManage: boolean;
}) {
  const publish = usePublishPromotion();
  const unpublish = useUnpublishPromotion();

  const status = toPublicStatus(promotion.status);
  const checked = status === "public";
  const archived = promotion.status === "archived";
  const pending = publish.isPending || unpublish.isPending;

  if (!canManage || archived) {
    return <PublicStatusBadge status={status} />;
  }

  const toggle = async (next: boolean) => {
    if (next) {
      const blocker = publishBlocker(promotion);
      if (blocker) {
        toast.warning(blocker);
        return;
      }
    }
    try {
      await (next ? publish : unpublish).mutateAsync(promotion.id);
      toast.success(
        next
          ? `เปิดแสดง "${promotion.title}" ใน LINE OA แล้ว`
          : `ซ่อน "${promotion.title}" จาก LINE OA แล้ว`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ";
      toast.warning(publishErrorMessage(message, promotion.title));
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
    />
  );
}
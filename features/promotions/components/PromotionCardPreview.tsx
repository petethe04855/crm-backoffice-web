"use client";

import { ImagePlus } from "lucide-react";
import { CTA_TYPE_LABEL, type PromotionCTAType, type PromotionPlacement } from "../types/promotion";
import { mediaUrl } from "@/lib/media";

const CTA_BUTTON_LABEL: Record<PromotionCTAType, string> = {
  none: "",
  url: "ดูรายละเอียด",
  reward: "ไปที่ของรางวัล",
  coupon: "รับคูปอง",
};

export interface PromotionCardPreviewInput {
  title: string;
  description: string;
  imageUrl: string;
  placement: PromotionPlacement;
  ctaType: PromotionCTAType;
}

/**
 * The customer's view of the promotion in LINE, at phone width (375px). It
 * mirrors the form values as they are typed so staff can check the copy before
 * publishing.
 */
export function PromotionCardPreview({ values }: { values: PromotionCardPreviewInput }) {
  const title = values.title.trim() || "ชื่อโปรโมชั่น";
  const cta = CTA_BUTTON_LABEL[values.ctaType];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">ตัวอย่างการ์ดใน LINE</h3>
      </div>

      <div className="w-[375px] max-w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex aspect-[16/9] items-center justify-center bg-neutral-100">
          {values.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded files live on the API host
            <img src={mediaUrl(values.imageUrl)} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-neutral-400">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              <span className="text-xs">ยังไม่มีรูป</span>
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <p className="text-base font-semibold leading-snug text-neutral-900">{title}</p>
          {values.description.trim() && (
            <p className="line-clamp-3 whitespace-pre-line text-sm text-neutral-600">
              {values.description.trim()}
            </p>
          )}
          {cta && (
            <span className="inline-flex w-full items-center justify-center rounded-md bg-[#06C755] px-4 py-2 text-sm font-medium text-white">
              {cta}
            </span>
          )}
          {values.ctaType !== "none" && (
            <p className="text-[11px] text-neutral-400">{CTA_TYPE_LABEL[values.ctaType]}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Whether an item is shown to members in the LINE OA (LIFF) right now.
 * Computed by backoffice-api with the same rules the LIFF endpoints filter on;
 * this app only displays it.
 */
export type LineVisibilityReason =
  | "live"
  | "limited"
  | "draft"
  | "paused"
  | "inactive"
  | "archived"
  | "not_started"
  | "expired"
  | "quota_full"
  | "out_of_stock";

export interface LineVisibility {
  visible: boolean;
  reason: LineVisibilityReason;
  /** When a not-yet-started item appears. */
  from?: string;
  /** When a visible item disappears (absent = no end). */
  until?: string;
}

/** Short label for tables. */
export const LINE_VISIBILITY_LABEL: Record<LineVisibilityReason, string> = {
  live: "แสดงอยู่",
  limited: "แสดงบางกลุ่ม",
  draft: "ยังไม่แสดง · ร่าง",
  paused: "ยังไม่แสดง · พักไว้",
  inactive: "ยังไม่แสดง · ปิดไว้",
  archived: "ไม่แสดง · ปิดแล้ว",
  not_started: "รอเริ่มแสดง",
  expired: "ไม่แสดง · หมดเวลา",
  quota_full: "ไม่แสดง · สิทธิ์เต็ม",
  out_of_stock: "ไม่แสดง · ของหมด",
};

/** What to do so members can see it (form panel). */
export const LINE_VISIBILITY_HINT: Record<LineVisibilityReason, string> = {
  live: "สมาชิกทุกคนเห็นใน LINE OA",
  limited: "เห็นเฉพาะสมาชิกตามกลุ่ม/ระดับที่กำหนด",
  draft: "กด \"บันทึกและแสดงใน LINE OA\" เพื่อให้สมาชิกเห็น",
  paused: "กด \"บันทึกและแสดงใน LINE OA\" เพื่อเปิดอีกครั้ง",
  inactive: "กด \"บันทึกและแสดงใน LINE OA\" เพื่อเปิดอีกครั้ง",
  archived: "ปิดถาวรแล้ว — ทำสำเนาหรือสร้างใหม่หากต้องการแสดงอีก",
  not_started: "จะแสดงเองเมื่อถึงเวลาเริ่ม — แก้เวลาเริ่มหากต้องการแสดงทันที",
  expired: "เลยเวลาสิ้นสุดแล้ว — แก้เวลาสิ้นสุดให้อยู่ในอนาคต",
  quota_full: "สิทธิ์ถูกรับครบแล้ว — เพิ่มจำนวนสิทธิ์รวมเพื่อแสดงอีก",
  out_of_stock: "สต็อกหรือโควต้าหมด — เพิ่มสต็อกใน ERP หรือเพิ่มจำนวนที่แลกได้",
};

/** Reasons that the "save and show in LINE OA" button can fix by itself. */
export const SHOWABLE_REASONS: ReadonlySet<LineVisibilityReason> = new Set(["draft", "paused", "inactive"]);

/** Redemption status text exactly as LIFF shows it to the member. */
export const MEMBER_REDEMPTION_STATUS_TEXT = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  packing: "กำลังแพ็ก",
  shipped: "จัดส่งแล้ว",
  delivered: "ได้รับแล้ว",
  cancelled: "ยกเลิก",
} as const;

/** One LINE message queued for the member. */
export interface LineDelivery {
  status: "pending" | "sent" | "dead";
  queuedAt: string;
  sentAt?: string;
}

/** LINE messages of one redemption; null = never queued. */
export interface RedemptionLineMessages {
  redeemed: LineDelivery | null;
  shipped: LineDelivery | null;
}

/**
 * Why the "แสดงใน LINE OA" row button is unavailable, or undefined when it
 * can be pressed (the item is a draft / paused / switched off).
 */
export function showDisabledReason(v: LineVisibility | undefined | null): string | undefined {
  if (!v) return undefined;
  if (v.visible) return "แสดงใน LINE OA อยู่แล้ว";
  if (SHOWABLE_REASONS.has(v.reason)) return undefined;
  return LINE_VISIBILITY_HINT[v.reason];
}

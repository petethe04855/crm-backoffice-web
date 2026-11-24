import { describe, expect, it } from "vitest";
import { publishBlocker, publishErrorMessage } from "@/features/promotions/components/PromotionPublicSwitch";

const now = new Date("2026-11-24T10:00:00Z");
const base = { title: "โปรเดือนนี้", imageUrl: "/api/v1/files/a", displayStartAt: "2026-11-20T00:00:00Z", displayEndAt: "2026-11-30T00:00:00Z" };

describe("publishBlocker", () => {
  it("allows a promotion with an image and a future window", () => {
    expect(publishBlocker(base, now)).toBeNull();
  });

  it("explains a missing window, an expired window and a missing image in Thai", () => {
    expect(publishBlocker({ ...base, displayStartAt: null, displayEndAt: null }, now)).toContain("ยังไม่ได้ตั้งช่วงวัน-เวลาแสดงผล");
    expect(publishBlocker({ ...base, displayEndAt: "2026-11-24T09:00:00Z" }, now)).toContain("หมดเวลาแสดงแล้ว");
    expect(publishBlocker({ ...base, imageUrl: "" }, now)).toContain("ยังไม่มีรูปแบนเนอร์");
  });
});

describe("publishErrorMessage", () => {
  it("translates the API's publish refusals and passes others through", () => {
    expect(publishErrorMessage("displayStartAt: display window is required to publish", "A")).toContain("ยังไม่ได้ตั้งช่วงวัน-เวลาแสดงผล");
    expect(publishErrorMessage("displayEndAt: must be in the future", "A")).toContain("หมดเวลาแสดงแล้ว");
    expect(publishErrorMessage("ระบบขัดข้อง", "A")).toBe("ระบบขัดข้อง");
  });
});

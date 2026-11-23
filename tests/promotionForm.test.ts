import { describe, expect, it } from "vitest";
import {
  EMPTY_PROMOTION_FORM,
  fieldErrors,
  promotionFormSchema,
  toDateTimeLocal,
  toFormValues,
  toPromotionInput,
  type PromotionFormValues,
} from "@/features/promotions/schemas/promotionForm";
import type { Promotion } from "@/features/promotions/types/promotion";

function form(overrides: Partial<PromotionFormValues> = {}): PromotionFormValues {
  return { ...EMPTY_PROMOTION_FORM, ...overrides };
}

function messages(values: PromotionFormValues): Record<string, string> {
  const parsed = promotionFormSchema.safeParse(values);
  return parsed.success ? {} : fieldErrors(parsed.error);
}

describe("promotionFormSchema", () => {
  it("accepts a title-only draft", () => {
    const parsed = promotionFormSchema.safeParse(form({ title: "โปรตุลาคม" }));
    expect(parsed.success).toBe(true);
  });

  it("requires a title and caps its length", () => {
    expect(messages(form())).toMatchObject({ title: expect.any(String) });
    expect(messages(form({ title: "ก".repeat(121) }))).toMatchObject({ title: expect.any(String) });
    expect(messages(form({ title: "ก".repeat(120) }))).not.toHaveProperty("title");
  });

  it("caps the description at 2,000 characters", () => {
    expect(messages(form({ title: "x", description: "a".repeat(2001) }))).toHaveProperty("description");
  });

  it("requires both ends of the window", () => {
    expect(messages(form({ title: "x", displayStart: "2026-11-18T10:00" }))).toMatchObject({
      displayEnd: expect.any(String),
    });
    expect(messages(form({ title: "x", displayEnd: "2026-11-18T10:00" }))).toMatchObject({
      displayStart: expect.any(String),
    });
  });

  it("requires the end to be after the start", () => {
    expect(
      messages(
        form({
          title: "x",
          displayStart: "2026-11-18T10:00",
          displayEnd: "2026-11-18T10:00",
        }),
      ),
    ).toMatchObject({ displayEnd: expect.any(String) });
    expect(
      messages(
        form({ title: "x", displayStart: "2026-11-18T10:00", displayEnd: "2026-11-18T11:00" }),
      ),
    ).not.toHaveProperty("displayEnd");
  });

  it("requires https for a url CTA and a target for reward/coupon", () => {
    expect(
      messages(form({ title: "x", ctaType: "url", ctaTarget: "http://example.com" })),
    ).toMatchObject({ ctaTarget: expect.any(String) });
    expect(
      messages(form({ title: "x", ctaType: "url", ctaTarget: "https://example.com/sale" })),
    ).not.toHaveProperty("ctaTarget");

    expect(messages(form({ title: "x", ctaType: "reward", ctaTarget: "  " }))).toMatchObject({
      ctaTarget: expect.any(String),
    });
    expect(messages(form({ title: "x", ctaType: "coupon", ctaTarget: "c-1" }))).not.toHaveProperty(
      "ctaTarget",
    );
    // A none CTA ignores whatever target was left behind.
    expect(
      messages(form({ title: "x", ctaType: "none", ctaTarget: "http://example.com" })),
    ).not.toHaveProperty("ctaTarget");
  });

  it("validates the audience day count and priority ranges", () => {
    expect(messages(form({ title: "x", newMemberDays: "0" }))).toHaveProperty("newMemberDays");
    expect(messages(form({ title: "x", newMemberDays: "3651" }))).toHaveProperty("newMemberDays");
    expect(messages(form({ title: "x", newMemberDays: "30" }))).not.toHaveProperty("newMemberDays");
    expect(messages(form({ title: "x", newMemberDays: "" }))).not.toHaveProperty("newMemberDays");
    expect(messages(form({ title: "x", priority: "-1" }))).toHaveProperty("priority");
    expect(messages(form({ title: "x", priority: "10" }))).not.toHaveProperty("priority");
  });
});

describe("toPromotionInput", () => {
  it("converts local datetime strings to ISO and blanks to null", () => {
    const input = toPromotionInput(
      form({
        title: "  โปรตุลาคม  ",
        displayStart: "2026-11-18T10:00",
        displayEnd: "2026-11-20T20:30",
        ctaType: "none",
        ctaTarget: "https://ignored.example.com",
        tiers: ["gold"],
        newMemberDays: "30",
        priority: "5",
      }),
    );

    expect(input.title).toBe("โปรตุลาคม");
    expect(input.displayStartAt).toBe(new Date(2026, 10, 18, 10, 0).toISOString());
    expect(input.displayEndAt).toBe(new Date(2026, 10, 20, 20, 30).toISOString());
    expect(input.ctaTarget).toBe("");
    expect(input.audience).toEqual({ tiers: ["gold"], newMemberDays: 30 });
    expect(input.priority).toBe(5);
  });

  it("keeps an empty draft window and audience as null/zero", () => {
    const input = toPromotionInput(form({ title: "ร่าง" }));
    expect(input.displayStartAt).toBeNull();
    expect(input.displayEndAt).toBeNull();
    expect(input.audience).toEqual({ tiers: [], newMemberDays: null });
    expect(input.priority).toBe(0);
  });
});

describe("toFormValues / toDateTimeLocal", () => {
  const promotion = {
    id: "p1",
    title: "โปร",
    description: "รายละเอียด",
    imageUrl: "/api/v1/files/x",
    placement: "popup",
    displayStartAt: new Date(2026, 10, 18, 10, 0).toISOString(),
    displayEndAt: new Date(2026, 10, 20, 20, 30).toISOString(),
    ctaType: "coupon",
    ctaTarget: "c-1",
    audience: { tiers: ["gold", "silver"], newMemberDays: 30 },
    priority: 7,
    status: "published",
    displayStatus: "scheduled",
    lineVisibility: { visible: false, reason: "not_started" },
    warnings: [],
    createdBy: 1,
    createdByEmail: "o@example.com",
    updatedBy: 1,
    updatedByEmail: "o@example.com",
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  } satisfies Promotion;

  it("round-trips a promotion into the form", () => {
    const values = toFormValues(promotion);
    expect(values).toMatchObject({
      title: "โปร",
      placement: "popup",
      displayStart: "2026-11-18T10:00",
      displayEnd: "2026-11-20T20:30",
      ctaType: "coupon",
      ctaTarget: "c-1",
      tiers: ["gold", "silver"],
      newMemberDays: "30",
      priority: "7",
    });
  });

  it("renders missing values as empty strings", () => {
    const values = toFormValues({
      ...promotion,
      displayStartAt: null,
      displayEndAt: null,
      audience: { tiers: [], newMemberDays: null },
      priority: 0,
    });
    expect(values.displayStart).toBe("");
    expect(values.displayEnd).toBe("");
    expect(values.newMemberDays).toBe("");
    expect(values.priority).toBe("0");
    expect(toDateTimeLocal(null)).toBe("");
  });
});

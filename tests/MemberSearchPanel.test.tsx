import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemberSearchPanel, countActiveFilters, validateManageFilters } from "@/features/membership/components/MemberSearchPanel";
import { EMPTY_MEMBER_FILTERS } from "@/features/membership/types/member";

const tiers = [{ id: 1, code: "bronze", name: "Bronze", minSpend: 0, earnMultiplier: 1, sortOrder: 0, isActive: true }];

describe("MemberSearchPanel", () => {
  it("applies the draft only on submit", async () => {
    const onApply = vi.fn();
    render(<MemberSearchPanel filters={EMPTY_MEMBER_FILTERS} tiers={tiers} onApply={onApply} />);

    await userEvent.type(screen.getByLabelText("ค้นหา"), "nop");
    await userEvent.selectOptions(screen.getByLabelText("ระดับ"), "1");
    expect(onApply).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "ค้นหา" }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ search: "nop", tierId: "1" }));
  });

  it("blocks a reversed date range", async () => {
    const onApply = vi.fn();
    render(<MemberSearchPanel filters={EMPTY_MEMBER_FILTERS} tiers={tiers} onApply={onApply} />);

    await userEvent.type(screen.getByLabelText("สมัครตั้งแต่"), "2026-11-15");
    await userEvent.type(screen.getByLabelText("ถึง"), "2026-11-01");

    expect(screen.getByRole("alert")).toHaveTextContent("วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด");
    expect(screen.getByRole("button", { name: "ค้นหา" })).toBeDisabled();
  });

  it("counts active filters", () => {
    expect(countActiveFilters(EMPTY_MEMBER_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_MEMBER_FILTERS, search: " x ", status: "active" })).toBe(2);
  });
});

describe("validateManageFilters", () => {
  const empty = { minPoints: "", maxPoints: "", inactiveDays: "" };

  it("accepts empty and valid values", () => {
    expect(validateManageFilters(empty)).toBeNull();
    expect(validateManageFilters({ minPoints: "0", maxPoints: "100", inactiveDays: "30" })).toBeNull();
  });

  it("rejects non-integer and reversed point ranges", () => {
    expect(validateManageFilters({ ...empty, minPoints: "-1" })).toContain("จำนวนเต็ม");
    expect(validateManageFilters({ ...empty, maxPoints: "1.5" })).toContain("จำนวนเต็ม");
    expect(validateManageFilters({ ...empty, minPoints: "200", maxPoints: "100" })).toContain("ไม่เกิน");
  });

  it("rejects out-of-range inactivity days", () => {
    expect(validateManageFilters({ ...empty, inactiveDays: "0" })).toContain("1–3650");
    expect(validateManageFilters({ ...empty, inactiveDays: "4000" })).toContain("1–3650");
  });
});

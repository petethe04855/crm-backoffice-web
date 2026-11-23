import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RowActions } from "@/components/common/RowActions";

describe("RowActions", () => {
  it("runs show, links to edit and confirms before delete", async () => {
    const show = vi.fn().mockResolvedValue(undefined);
    const remove = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(
      <RowActions
        editHref="/coupons/7"
        show={{ label: "แสดงใน LINE OA", run: show }}
        remove={{ label: "ลบ", run: remove }}
        confirmDelete="ลบคูปอง?"
      />,
    );
    expect(screen.getByRole("link", { name: /แก้ไข/ })).toHaveAttribute("href", "/coupons/7");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: /แสดงใน LINE OA/ })));
    expect(show).toHaveBeenCalledOnce();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: /ลบ/ })));
    expect(remove).not.toHaveBeenCalled(); // cancelled in the dialog
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /ลบ/ })));
    expect(remove).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith("ลบคูปอง?");
    confirm.mockRestore();
  });

  it("disables unavailable actions with the reason and shows API errors", async () => {
    const show = vi.fn().mockRejectedValue(new Error("ยังไม่ได้กำหนดช่วงเวลาแสดง"));
    render(
      <RowActions
        editHref="/rewards/1"
        show={{ label: "แสดงใน LINE OA", run: show }}
        remove={{ label: "ลบ", run: vi.fn(), disabledReason: "มีการแลกไปแล้ว ลบไม่ได้" }}
        confirmDelete="ลบ?"
      />,
    );
    const del = screen.getByRole("button", { name: /ลบ/ });
    expect(del).toBeDisabled();
    expect(del.parentElement).toHaveAttribute("title", "มีการแลกไปแล้ว ลบไม่ได้");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: /แสดงใน LINE OA/ })));
    expect(screen.getByRole("alert")).toHaveTextContent("ยังไม่ได้กำหนดช่วงเวลาแสดง");
  });

  it("shows only edit when the staff member cannot manage", () => {
    render(<RowActions editHref="/promotions/x" confirmDelete="" />);
    expect(screen.getByRole("link", { name: /แก้ไข/ })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

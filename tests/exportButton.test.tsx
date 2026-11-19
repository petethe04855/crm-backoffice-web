import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExportButton, type ExportPayload } from "@/components/common/ExportButton";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExportButton", () => {
  it("fetches the file and saves it under the returned name", async () => {
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLElement.prototype, "click").mockImplementation(function (this: HTMLElement) {
      clicked.push(this as HTMLAnchorElement);
    });

    const blob = new Blob(["xlsx-bytes"]);
    const onExport = vi.fn().mockResolvedValue({ blob, filename: "members.xlsx" });
    render(<ExportButton onExport={onExport} label="ส่งออกสมาชิก" />);

    fireEvent.click(screen.getByRole("button", { name: "ส่งออกสมาชิก" }));

    expect(await screen.findByRole("button", { name: "ส่งออกสมาชิก" })).toBeEnabled();
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe("members.xlsx");
    expect(clicked[0].href).toContain("blob:");
  });

  it("shows a loading state until the request settles", async () => {
    let resolveExport!: (value: ExportPayload) => void;
    const onExport = vi.fn(
      () =>
        new Promise<ExportPayload>((resolve) => {
          resolveExport = resolve;
        }),
    );
    vi.spyOn(HTMLElement.prototype, "click").mockImplementation(() => {});

    render(<ExportButton onExport={onExport} label="ส่งออก" loadingLabel="กำลังสร้างไฟล์" />);
    fireEvent.click(screen.getByRole("button", { name: "ส่งออก" }));

    const busy = await screen.findByRole("button", { name: "กำลังสร้างไฟล์" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      resolveExport({ blob: new Blob(["ok"]), filename: "list.xlsx" });
    });

    expect(await screen.findByRole("button", { name: "ส่งออก" })).toBeEnabled();
  });

  it("keeps the API error message visible and re-enables the button", async () => {
    const onExport = vi.fn().mockRejectedValue(new Error("คุณไม่มีสิทธิ์ส่งออกข้อมูล"));
    render(<ExportButton onExport={onExport} label="ส่งออก" />);

    fireEvent.click(screen.getByRole("button", { name: "ส่งออก" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("คุณไม่มีสิทธิ์ส่งออกข้อมูล");
    expect(screen.getByRole("button", { name: "ส่งออก" })).toBeEnabled();
  });

  it("does not call the API while disabled and explains why", () => {
    const onExport = vi.fn();
    render(
      <ExportButton
        onExport={onExport}
        label="ส่งออก"
        disabled
        disabledHint="ต้องมีสิทธิ์ส่งออกข้อมูล"
      />,
    );

    expect(screen.getByRole("button", { name: "ส่งออก" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("ต้องมีสิทธิ์ส่งออกข้อมูล");
    fireEvent.click(screen.getByRole("button", { name: "ส่งออก" }));
    expect(onExport).not.toHaveBeenCalled();
  });
});

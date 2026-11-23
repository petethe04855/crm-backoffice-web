import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ThaiDateInput } from "@/components/form/ThaiDateInput";

function Harness({
  kind = "date",
  initial = "2026-11-23",
  onChange = () => {},
}: {
  kind?: "date" | "datetime" | "month";
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ThaiDateInput
      id="d"
      kind={kind}
      aria-label="วันที่"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe("ThaiDateInput calendar", () => {
  it("opens a Thai calendar (Buddhist era) and shows the picked day in Thai", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(screen.getByLabelText("วันที่")).toHaveValue("23/11/2569");

    fireEvent.click(screen.getByRole("button", { name: "เลือกจากปฏิทิน" }));
    const cal = screen.getByRole("dialog", { name: "เลือกวันที่" });
    expect(within(cal).getByText("พฤศจิกายน 2569")).toBeInTheDocument();
    expect(within(cal).getAllByText(/^พฤ/).length).toBeGreaterThan(0); // Thai weekday names

    fireEvent.click(within(cal).getByRole("button", { name: "5 พฤศจิกายน 2569" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-11-05");
    expect(screen.getByLabelText("วันที่")).toHaveValue("05/11/2569");
    expect(screen.queryByRole("dialog")).toBeNull(); // a plain date closes on pick
  });

  it("moves between months", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "เลือกจากปฏิทิน" }));
    fireEvent.click(screen.getByRole("button", { name: "เดือนถัดไป" }));
    expect(screen.getByText("ธันวาคม 2569")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "เดือนถัดไป" }));
    expect(screen.getByText("มกราคม 2570")).toBeInTheDocument();
  });

  it("picks the time on a 24-hour clock (00–23)", () => {
    const onChange = vi.fn();
    render(<Harness kind="datetime" initial="2026-11-23T08:05" onChange={onChange} />);
    expect(screen.getByLabelText("วันที่")).toHaveValue("23/11/2569 08:05");
    fireEvent.click(screen.getByRole("button", { name: "เลือกจากปฏิทิน" }));

    const hour = screen.getByLabelText("ชั่วโมง") as HTMLSelectElement;
    expect(hour.options).toHaveLength(24);
    expect(hour.options[0].textContent).toBe("00");
    expect(hour.options[23].textContent).toBe("23");
    expect(screen.queryByText(/AM|PM/)).toBeNull();

    fireEvent.change(hour, { target: { value: "20" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-11-23T20:05");
    expect(screen.getByLabelText("วันที่")).toHaveValue("23/11/2569 20:05");
  });

  it("picks a month for kind=month and closes on Escape", () => {
    const onChange = vi.fn();
    render(<Harness kind="month" initial="2026-11" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "เลือกจากปฏิทิน" }));
    expect(screen.getByText("พ.ศ. 2569")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ม.ค." }));
    expect(onChange).toHaveBeenLastCalledWith("2026-01");

    fireEvent.click(screen.getByRole("button", { name: "เลือกจากปฏิทิน" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

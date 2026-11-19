import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  DateRangeField,
  validateDateRange,
  type DateRangeValue,
} from "@/components/form/DateRangeField";

function Harness({
  withTime = false,
  initial = { start: "", end: "" },
  onChange = () => {},
}: {
  withTime?: boolean;
  initial?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateRangeField
      value={value}
      withTime={withTime}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("validateDateRange", () => {
  it("accepts ordered and half-open ranges", () => {
    expect(validateDateRange("2026-11-01", "2026-11-30")).toBeNull();
    expect(validateDateRange("2026-11-18", "2026-11-18")).toBeNull();
    expect(validateDateRange("", "2026-11-30")).toBeNull();
    expect(validateDateRange("2026-11-01", "")).toBeNull();
  });

  it("rejects a start after the end", () => {
    expect(validateDateRange("2026-11-30", "2026-11-01")).toBe("วันเริ่มต้นต้องไม่เกินวันสิ้นสุด");
  });
});

describe("DateRangeField", () => {
  it("sets date inputs and reports an inverted range, then clears it", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const start = screen.getByLabelText("วันเริ่มต้น");
    const end = screen.getByLabelText("วันสิ้นสุด");
    expect(start).toHaveAttribute("type", "date");
    expect(end).toHaveAttribute("type", "date");

    fireEvent.change(start, { target: { value: "2026-11-20" } });
    fireEvent.change(end, { target: { value: "2026-11-19" } });

    expect(screen.getByRole("alert")).toHaveTextContent("วันเริ่มต้นต้องไม่เกินวันสิ้นสุด");
    expect(start).toHaveAttribute("aria-invalid", "true");
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-20", end: "2026-11-19" });

    fireEvent.change(end, { target: { value: "2026-11-21" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(start).not.toHaveAttribute("aria-invalid");
  });

  it("uses datetime-local inputs and compares times on the same day", () => {
    render(<Harness withTime />);

    const start = screen.getByLabelText("วันเริ่มต้น");
    const end = screen.getByLabelText("วันสิ้นสุด");
    expect(start).toHaveAttribute("type", "datetime-local");

    fireEvent.change(start, { target: { value: "2026-11-18T10:00" } });
    fireEvent.change(end, { target: { value: "2026-11-18T09:00" } });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(end, { target: { value: "2026-11-18T10:00" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an external error instead of the computed one", () => {
    render(
      <DateRangeField
        value={{ start: "2026-11-01", end: "2026-11-02" }}
        onChange={() => {}}
        error="ช่วงวันที่ต้องไม่เกิน 1 ปี"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("ช่วงวันที่ต้องไม่เกิน 1 ปี");
  });
});

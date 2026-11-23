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
  it("picks a range on the calendar", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial={{ start: "2026-11-01", end: "2026-11-30" }} />);

    const field = screen.getByRole("button", { name: /วันเริ่มต้น – วันสิ้นสุด/ });
    expect(field).toHaveTextContent("01/11/2569 – 30/11/2569");

    fireEvent.click(field);
    fireEvent.click(screen.getAllByRole("button", { name: "10 พฤศจิกายน 2569" })[0]);
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-10", end: "" });
    fireEvent.click(screen.getAllByRole("button", { name: "20 พฤศจิกายน 2569" })[0]);
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-10", end: "2026-11-20" });
    expect(field).toHaveTextContent("10/11/2569 – 20/11/2569");
  });

  it("with time: reports an end time before the start time on the same day", () => {
    render(<Harness withTime initial={{ start: "2026-11-18T10:00", end: "2026-11-18T09:00" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("วันเริ่มต้นต้องไม่เกินวันสิ้นสุด");

    fireEvent.click(screen.getByRole("button", { name: /วันเริ่มต้น – วันสิ้นสุด/ }));
    const endHour = screen.getByLabelText("เวลาสิ้นสุด ชั่วโมง") as HTMLSelectElement;
    expect(endHour.options).toHaveLength(24); // 00–23
    fireEvent.change(endHour, { target: { value: "11" } });
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

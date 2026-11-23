import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ThaiDateRangeInput, type DateRange } from "@/components/form/ThaiDateRangeInput";

function Harness({
  initial = { start: "", end: "" },
  withTime = false,
  optional = false,
  onChange = () => {},
}: {
  initial?: DateRange;
  withTime?: boolean;
  optional?: boolean;
  onChange?: (r: DateRange) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ThaiDateRangeInput
      aria-label="ช่วง"
      withTime={withTime}
      optional={optional}
      emptyStartLabel="ทันที"
      emptyEndLabel="ไม่มีกำหนด"
      value={value}
      onChange={(r) => {
        setValue(r);
        onChange(r);
      }}
    />
  );
}

const day = (name: string) => screen.getAllByRole("button", { name })[0];

describe("ThaiDateRangeInput", () => {
  it("shows two Thai months (Buddhist era) and picks start then end", () => {
    const onChange = vi.fn();
    render(<Harness initial={{ start: "2026-11-05", end: "" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "ช่วง" }));
    expect(screen.getByText("พฤศจิกายน 2569")).toBeInTheDocument();
    expect(screen.getByText("ธันวาคม 2569")).toBeInTheDocument();

    fireEvent.click(day("3 ธันวาคม 2569"));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-05", end: "2026-12-03" });
    // a plain date range closes once both ends are set
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "ช่วง" })).toHaveTextContent("05/11/2569 – 03/12/2569");
  });

  it("starts over when a full range is clicked again, or a day before the start", () => {
    const onChange = vi.fn();
    render(<Harness initial={{ start: "2026-11-10", end: "2026-11-20" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "ช่วง" }));
    fireEvent.click(day("12 พฤศจิกายน 2569"));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-12", end: "" });
    fireEvent.click(day("2 พฤศจิกายน 2569"));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-02", end: "" });
  });

  it("with time: keeps a 24-hour start and end time", () => {
    const onChange = vi.fn();
    render(<Harness withTime initial={{ start: "", end: "" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "ช่วง" }));
    fireEvent.click(day("10 พฤศจิกายน 2569"));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-10T00:00", end: "" });
    fireEvent.click(day("12 พฤศจิกายน 2569"));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-10T00:00", end: "2026-11-12T23:59" });

    fireEvent.change(screen.getByLabelText("เวลาเริ่ม ชั่วโมง"), { target: { value: "20" } });
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-10T20:00", end: "2026-11-12T23:59" });
    expect(screen.queryByText(/AM|PM/)).toBeNull();
    expect(screen.getByRole("button", { name: "ช่วง" })).toHaveTextContent("10/11/2569 20:00 – 12/11/2569 23:59");
  });

  it("optional: either side can be left open", () => {
    const onChange = vi.fn();
    render(<Harness optional initial={{ start: "2026-11-10", end: "2026-11-20" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "ช่วง" }));
    fireEvent.click(screen.getByRole("button", { name: /ไม่กำหนดวันสิ้นสุด/ }));
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-11-10", end: "" });
    expect(screen.getByRole("button", { name: "ช่วง" })).toHaveTextContent("10/11/2569 – ไม่มีกำหนด");

    fireEvent.click(screen.getByRole("button", { name: /ไม่กำหนดวันเริ่ม/ }));
    expect(onChange).toHaveBeenLastCalledWith({ start: "", end: "" });
  });
});

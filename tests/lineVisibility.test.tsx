import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineVisibilityBadge, LineVisibilityPanel } from "@/features/line-oa/components/LineVisibilityBadge";
import { RedemptionMemberView } from "@/features/line-oa/components/RedemptionMemberView";

describe("LineVisibilityBadge", () => {
  it("shows live and hidden states", () => {
    const { rerender } = render(<LineVisibilityBadge value={{ visible: true, reason: "live" }} />);
    expect(screen.getByText("แสดงอยู่")).toBeInTheDocument();
    rerender(<LineVisibilityBadge value={{ visible: false, reason: "draft" }} />);
    expect(screen.getByText("ยังไม่แสดง · ร่าง")).toBeInTheDocument();
    rerender(<LineVisibilityBadge value={{ visible: false, reason: "not_started", from: "2026-11-23T03:00:00Z" }} />);
    expect(screen.getByText(/^รอเริ่ม /)).toBeInTheDocument();
  });

  it("panel tells staff how to show an item that is not saved yet", () => {
    render(<LineVisibilityPanel value={undefined} />);
    expect(screen.getByText(/บันทึกและแสดงใน LINE OA/)).toBeInTheDocument();
  });

  it("panel explains an expired item", () => {
    render(<LineVisibilityPanel value={{ visible: false, reason: "expired" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("หมดเวลา");
    expect(screen.getByRole("status")).toHaveTextContent("แก้เวลาสิ้นสุด");
  });
});

describe("RedemptionMemberView", () => {
  it("shows the member's status text, tracking number and LINE messages", () => {
    render(
      <RedemptionMemberView
        status="shipped"
        trackingNo="TH123"
        cancelReason=""
        lineMessages={{
          redeemed: { status: "sent", queuedAt: "2026-11-22T10:00:00Z", sentAt: "2026-11-22T10:00:10Z" },
          shipped: { status: "pending", queuedAt: "2026-11-22T12:00:00Z" },
        }}
      />,
    );
    expect(screen.getByText("จัดส่งแล้ว")).toBeInTheDocument();
    expect(screen.getByText("เลขพัสดุ TH123")).toBeInTheDocument();
    expect(screen.getByText("LINE แลกสำเร็จ: ส่งแล้ว")).toBeInTheDocument();
    expect(screen.getByText("LINE จัดส่ง: รอส่ง")).toBeInTheDocument();
  });

  it("marks cancelled redemptions as refunded and hides the ship message before shipping", () => {
    render(
      <RedemptionMemberView status="cancelled" trackingNo="" cancelReason="ของหมด" lineMessages={{ redeemed: null, shipped: null }} />,
    );
    expect(screen.getByText("ยกเลิก (คืนแต้มแล้ว)")).toBeInTheDocument();
    expect(screen.getByText("เหตุผล: ของหมด")).toBeInTheDocument();
    expect(screen.getByText("LINE แลกสำเร็จ: ไม่ได้ส่ง")).toBeInTheDocument();
    expect(screen.queryByText(/LINE จัดส่ง/)).not.toBeInTheDocument();
  });
});

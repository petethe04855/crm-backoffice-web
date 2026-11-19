import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BehaviorPanel } from "@/features/sales-dashboard/components/panels/BehaviorPanel";
import { CustomerPanel } from "@/features/sales-dashboard/components/panels/CustomerPanel";
import { FlavorPanel } from "@/features/sales-dashboard/components/panels/FlavorPanel";
import { OverviewPanel } from "@/features/sales-dashboard/components/panels/OverviewPanel";
import type { SalesReport } from "@/features/sales-dashboard/types/salesDashboard";

const emptySummary = {
  sales: 0,
  orders: 0,
  buyers: 0,
  items: 0,
  aov: 0,
  salesChangePercent: null,
  ordersChangePercent: null,
  buyersChangePercent: null,
  aovChangePercent: null,
};

function report(overrides: Partial<SalesReport> = {}): SalesReport {
  return {
    range: { from: "2026-11-01", to: "2026-11-30", days: 30 },
    channel: "all",
    region: "",
    masked: false,
    summary: { ...emptySummary, sales: 1000, orders: 4, buyers: 2, items: 10, aov: 250 },
    previous: emptySummary,
    channels: [{ channel: "shopee", label: "Shopee", orders: 2, sales: 600, sharePercent: 60 }],
    trend: { weekly: [], monthly: [] },
    flavors: [],
    products: [{ sku: "CHK-01", name: "ไก่ 5 ถุง", units: 10, orders: 2, sales: 600, sharePercent: 60 }],
    sets: [{ name: "เซ็ต 5", orders: 1, sharePercent: 50 }],
    accessories: [{ key: "cat_wand", label: "ไม้ตกแมว", units: 1, sharePercent: 100 }],
    provinces: [
      { province: "กรุงเทพมหานคร", region: "กรุงเทพฯ และปริมณฑล", buyers: 2, orders: 4, sales: 1000, aov: 250, sharePercent: 100 },
    ],
    regions: [
      { region: "กรุงเทพฯ และปริมณฑล", provinceCount: 1, orders: 4, sales: 1000, sharePercent: 100 },
    ],
    customers: [
      {
        platform: "shopee",
        buyer: "alice",
        orders: 2,
        sales: 600,
        aov: 300,
        items: 6,
        firstOrder: "2026-11-02",
        lastOrder: "2026-11-20",
        province: "กรุงเทพมหานคร",
        frequencyBucket: "ซื้อ 2 ครั้ง",
      },
    ],
    frequencies: [{ label: "ซื้อ 2 ครั้ง", buyers: 1, sharePercent: 50 }],
    timing: {
      hours: Array.from({ length: 24 }, (_, hour) => ({ hour, orders: hour === 20 ? 3 : 0, sales: 0 })),
      weekdays: [{ day: 1, label: "จันทร์", orders: 4, sales: 1000 }],
      daysOfMonth: [{ day: 2, orders: 4, sales: 1000 }],
      peakHour: 20,
      peakWeekday: "จันทร์",
      peakDay: 2,
    },
    repurchase: {
      buckets: [{ label: "1-7 วัน", minDays: 1, maxDays: 7, buyers: 1, sharePercent: 100 }],
      repeatBuyers: 1,
      repeatRatePercent: 50,
      averageGapDays: 4,
    },
    ...overrides,
  };
}

describe("sales dashboard panels", () => {
  it("renders the overview KPIs and spotlight", () => {
    render(<OverviewPanel report={report()} onOpenCustomer={() => {}} />);
    expect(screen.getByText("ยอดขายรวม")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("ไก่ 5 ถุง")).toBeInTheDocument();
  });

  it("renders empty overview widgets without crashing", () => {
    render(
      <OverviewPanel
        report={report({
          summary: emptySummary,
          previous: emptySummary,
          channels: [],
          products: [],
          provinces: [],
          regions: [],
          customers: [],
          flavors: [],
          repurchase: { buckets: [], repeatBuyers: 0, repeatRatePercent: 0, averageGapDays: 0 },
        })}
        onOpenCustomer={() => {}}
      />,
    );
    expect(screen.getByText("ไม่มีออเดอร์ในช่วงนี้")).toBeInTheDocument();
    expect(screen.getByText("ยังไม่มีข้อมูลรสชาติ")).toBeInTheDocument();
  });

  it("renders behaviour timing and empty frequency buckets", () => {
    render(<BehaviorPanel report={report({ frequencies: [] })} />);
    expect(screen.getByText("ลูกค้าซื้อซ้ำ")).toBeInTheDocument();
    expect(screen.getByText(/ไม่มีข้อมูลความถี่/)).toBeInTheDocument();
  });

  it("renders the flavor mix and SKU table", () => {
    render(<FlavorPanel report={report()} />);
    expect(screen.getByText("สัดส่วนรสชาติที่ขายได้")).toBeInTheDocument();
    expect(screen.getByText("CHK-01")).toBeInTheDocument();
  });

  it("hides buyer rows from a staff member without permission", () => {
    render(<CustomerPanel report={report()} showCustomers={false} onOpenCustomer={() => {}} />);
    expect(screen.getByText(/ต้องมีสิทธิ์ดูลูกค้ารายบุคคล/)).toBeInTheDocument();
    expect(screen.queryByText("alice")).not.toBeInTheDocument();
  });

  it("lists buyers for a permitted staff member", () => {
    render(<CustomerPanel report={report()} showCustomers onOpenCustomer={() => {}} />);
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("ดูออเดอร์")).toBeInTheDocument();
  });
});

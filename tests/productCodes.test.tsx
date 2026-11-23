import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductCodeBatchesView } from "@/features/product-codes/components/ProductCodeBatchesView";
import { productCodesApi } from "@/features/product-codes/api/productCodesApi";
import { batchFormSchema, EMPTY_BATCH_FORM } from "@/features/product-codes/schemas/batchForm";
import type { ProductCodeBatch } from "@/features/product-codes/types/productCode";
import { useAuthStore } from "@/stores/authStore";

vi.mock("@/features/product-codes/api/productCodesApi", () => ({
  productCodesApi: { list: vi.fn(), create: vi.fn(), export: vi.fn(), activate: vi.fn(), void: vi.fn() },
}));
vi.mock("@/features/rewards/hooks/useRewards", () => ({
  useERPSKUOptions: () => ({
    data: { items: [{ id: 101, code: "CHK-01", name: "ขนมไก่", imageUrl: "", category: "", price: 59, availableQty: 10 }], total: 1 },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock("@/lib/download", () => ({ saveBlob: vi.fn() }));

function render(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return rtlRender(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const draft: ProductCodeBatch = {
  id: 1,
  batchNo: "PC2611-0001",
  erpSkuId: 101,
  skuCode: "CHK-01",
  skuName: "ขนมไก่",
  skuPrice: 59,
  quantity: 1000,
  pointsPerCode: 10,
  spendValuePerCode: 59,
  lotNumber: "LOT-A",
  isTest: false,
  status: "draft",
  note: "",
  createdByEmail: "owner@example.com",
  createdAt: "2026-11-22T00:00:00Z",
  stats: { total: 0, active: 0, used: 0, void: 0 },
};

function signIn(permissions: string[]) {
  useAuthStore.setState({ session: { erpUserId: 1, email: "x@example.com", roles: [], permissions }, checked: true });
}

describe("batch form schema", () => {
  it("requires a SKU and sane numbers", () => {
    expect(batchFormSchema.safeParse(EMPTY_BATCH_FORM).success).toBe(false);
    const ok = { ...EMPTY_BATCH_FORM, erpSkuId: 101, skuCode: "CHK-01", skuName: "ขนมไก่" };
    expect(batchFormSchema.safeParse(ok).success).toBe(true);
    expect(batchFormSchema.safeParse({ ...ok, quantity: 100001 }).success).toBe(false);
    expect(batchFormSchema.safeParse({ ...ok, pointsPerCode: 0 }).success).toBe(false);
  });
});

describe("ProductCodeBatchesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productCodesApi.list).mockResolvedValue({
      success: true,
      data: [draft, { ...draft, id: 2, batchNo: "PC2611-0002", status: "exported" }],
      meta: { page: 1, limit: 20, total: 2 },
    });
  });

  it("lets an owner export a draft once, after confirming", async () => {
    signIn(["product_codes.manage", "product_codes.export"]);
    vi.mocked(productCodesApi.export).mockResolvedValue({ blob: new Blob(["x"]), filename: "PC2611-0001-codes.xlsx" });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ProductCodeBatchesView />);

    await userEvent.click(await screen.findByRole("button", { name: /ส่งออก$/ }));
    expect(confirm.mock.calls[0][0]).toContain("ส่งออกได้ครั้งเดียว");
    await waitFor(() => expect(productCodesApi.export).toHaveBeenCalledWith(1, "xlsx"));
    expect(screen.getByRole("button", { name: /เปิดใช้/ })).toBeInTheDocument();
  });

  it("hides export from staff without the export permission", async () => {
    signIn(["product_codes.manage"]);
    render(<ProductCodeBatchesView />);
    expect(await screen.findByText("รอ owner ส่งออก")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ส่งออก$/ })).not.toBeInTheDocument();
  });

  it("creates a draft batch from the ERP SKU dropdown", async () => {
    signIn(["product_codes.manage"]);
    vi.mocked(productCodesApi.create).mockResolvedValue(draft);
    render(<ProductCodeBatchesView />);

    await userEvent.selectOptions(await screen.findByLabelText("สินค้าจาก ERP"), "101");
    await userEvent.type(screen.getByLabelText("เลขล็อตสินค้า"), "LOT-A");
    await userEvent.click(screen.getByRole("button", { name: "สร้างล็อต (ร่าง)" }));

    await waitFor(() => expect(productCodesApi.create).toHaveBeenCalled());
    expect(vi.mocked(productCodesApi.create).mock.calls[0][0]).toMatchObject({
      erpSkuId: 101, skuCode: "CHK-01", skuPrice: 59, quantity: 1000, pointsPerCode: 10, lotNumber: "LOT-A",
    });
  });
});

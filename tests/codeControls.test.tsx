import { beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CodeControlsView } from "@/features/product-codes/components/CodeControlsView";
import { codeControlApi } from "@/features/product-codes/api/codeControlApi";
import { useAuthStore } from "@/stores/authStore";

vi.mock("@/features/product-codes/api/codeControlApi", () => ({
  codeControlApi: {
    policy: vi.fn(),
    putPolicy: vi.fn(),
    flagged: vi.fn(),
    testMembers: vi.fn(),
    addTestMember: vi.fn(),
    removeTestMember: vi.fn(),
  },
}));

function render(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return rtlRender(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function signIn(roles: string[]) {
  useAuthStore.setState({
    session: { erpUserId: 1, email: "x@example.com", roles, permissions: ["product_codes.manage"] },
    checked: true,
  });
}

describe("CodeControlsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(codeControlApi.policy).mockResolvedValue({ dailyQuota: 20, wrongPerHour: 5, wrongPerDay: 20 });
    vi.mocked(codeControlApi.flagged).mockResolvedValue([
      { memberId: 7, memberCode: "M2611-000007", name: "นก ทดสอบ", wrong: 22, lastAt: "2026-11-22T03:00:00Z" },
    ]);
    vi.mocked(codeControlApi.testMembers).mockResolvedValue([]);
  });

  it("lets an owner change the quota", async () => {
    signIn(["owner"]);
    vi.mocked(codeControlApi.putPolicy).mockResolvedValue({ dailyQuota: 30, wrongPerHour: 5, wrongPerDay: 20 });
    render(<CodeControlsView />);

    const quota = await screen.findByLabelText("จำนวนรหัสที่กรอกได้ต่อวัน");
    await userEvent.clear(quota);
    await userEvent.type(quota, "30");
    await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));
    await waitFor(() => expect(codeControlApi.putPolicy).toHaveBeenCalled());
    expect(vi.mocked(codeControlApi.putPolicy).mock.calls[0][0]).toEqual({ dailyQuota: 30, wrongPerHour: 5, wrongPerDay: 20 });
  });

  it("is read-only for admins and lists flagged members", async () => {
    signIn(["sales", "admin"]);
    render(<CodeControlsView />);
    expect(await screen.findByLabelText("จำนวนรหัสที่กรอกได้ต่อวัน")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "บันทึก" })).not.toBeInTheDocument();
    expect(await screen.findByText(/ผิด 22 ครั้ง/)).toBeInTheDocument();
  });

  it("adds a test member by id", async () => {
    signIn(["owner"]);
    vi.mocked(codeControlApi.addTestMember).mockResolvedValue();
    render(<CodeControlsView />);
    await userEvent.type(await screen.findByLabelText("รหัสสมาชิกในระบบ (ID)"), "12");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มผู้ทดสอบ" }));
    await waitFor(() => expect(codeControlApi.addTestMember).toHaveBeenCalledWith(12, expect.anything()));
  });
});

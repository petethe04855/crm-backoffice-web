import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { CRM_API_BASE_URL, ERP_API_BASE_URL, TOKEN_KEY, toApiError } from "@/lib/axios";
import { AUTH_COOKIE, hasPermission, useAuthStore } from "@/stores/authStore";

const session = { erpUserId: 1, email: "owner@example.com", roles: ["owner"], permissions: ["members.view"] };

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ session: null, checked: false });
  });

  it("stores the token and presence cookie, then clears both on logout", () => {
    useAuthStore.getState().setSession(session, "jwt-token");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("jwt-token");
    expect(document.cookie).toContain(`${AUTH_COOKIE}=1`);

    useAuthStore.getState().logout();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(document.cookie).not.toContain(`${AUTH_COOKIE}=1`);
  });

  it("checks permissions", () => {
    expect(hasPermission(session, "members.view")).toBe(true);
    expect(hasPermission(session, "staff_roles.manage")).toBe(false);
    expect(hasPermission(null, "members.view")).toBe(false);
  });
});

describe("api clients", () => {
  it("point at the CRM and ERP roots", () => {
    expect(CRM_API_BASE_URL).toBe("http://localhost:8090/api/v1/crm");
    expect(ERP_API_BASE_URL).toBe("http://localhost:8084/api/v1");
  });

  function axiosError(status?: number, data?: unknown, code?: string) {
    const config = { headers: new AxiosHeaders() };
    const response = status
      ? { status, statusText: "", headers: {}, config, data }
      : undefined;
    return new AxiosError("x", code, config, null, response as never);
  }

  it("uses the API error message when present", () => {
    const err = toApiError(axiosError(400, { error: { code: "VALIDATION_ERROR", message: "status: invalid" } }));
    expect(err.message).toBe("status: invalid");
    expect((err as Error & { status?: number }).status).toBe(400);
  });

  it("falls back to the HTTP status, timeout and offline messages", () => {
    expect(toApiError(axiosError(502, "<html>")).message).toContain("HTTP 502");
    expect(toApiError(axiosError(undefined, undefined, "ECONNABORTED")).message).toContain("timeout");
    expect(toApiError(axiosError()).message).toContain("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  });
});

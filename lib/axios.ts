import axios, { type AxiosError, type AxiosInstance } from "axios";

/** localStorage key for the ERP-issued staff JWT (separate from erp-web-v2's key). */
export const TOKEN_KEY = "crm_bo_token";

function apiRoot(raw: string | undefined, fallback: string): string {
  return (raw || fallback).replace(/\/api(?:\/v1)?(?:\/crm)?\/?$/, "").replace(/\/$/, "");
}

export const CRM_API_BASE_URL =
  apiRoot(process.env.NEXT_PUBLIC_BACKOFFICE_API_URL, "http://localhost:8090") + "/api/v1/crm";
export const ERP_API_BASE_URL =
  apiRoot(process.env.NEXT_PUBLIC_ERP_API_URL, "http://localhost:8084") + "/api/v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

type UnauthorizedListener = () => void;
let onUnauthorized: UnauthorizedListener = () => {};

/** The auth store registers how to log out when backoffice-api returns 401. */
export function setUnauthorizedListener(listener: UnauthorizedListener) {
  onUnauthorized = listener;
}

/** Turns an Axios error into an Error with a user-facing Thai message. */
export function toApiError(error: AxiosError): Error {
  if (!error.response && error.code === "ECONNABORTED") {
    return new Error("การเชื่อมต่อใช้เวลานานเกินไป (timeout) กรุณาลองใหม่อีกครั้ง");
  }
  const body = error.response?.data;
  const detail =
    body && typeof body === "object" && "error" in body
      ? (body as { error?: { message?: string } | string }).error
      : undefined;
  const message =
    typeof detail === "string"
      ? detail
      : detail?.message ||
        (error.response
          ? `ทำรายการไม่สำเร็จ (HTTP ${error.response.status})`
          : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
  const err = new Error(message) as Error & { status?: number };
  err.status = error.response?.status;
  return err;
}

function withAuth(client: AxiosInstance, logoutOn401: boolean): AxiosInstance {
  client.interceptors.request.use((config) => {
    // An explicit Authorization header (e.g. right after login) wins over storage.
    const token = getToken();
    if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (logoutOn401 && error.response?.status === 401) onUnauthorized();
      return Promise.reject(toApiError(error));
    },
  );
  return client;
}

/** backoffice-api: every CRM call goes here. */
export const crmClient = withAuth(
  axios.create({ baseURL: CRM_API_BASE_URL, timeout: 15000, headers: { "Content-Type": "application/json" } }),
  true,
);

/** erp-api-v2: used only for staff login. */
export const erpAuthClient = withAuth(
  axios.create({ baseURL: ERP_API_BASE_URL, timeout: 15000, headers: { "Content-Type": "application/json" } }),
  false,
);

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge proxy: a fast redirect based on the session-presence cookie only.
 * SessionGuard (app/(admin)/layout.tsx) verifies the session with
 * GET /crm/me, and backoffice-api validates the JWT on every call.
 */
const AUTH_COOKIE = "crm_bo_auth";
const PROTECTED_PREFIXES = ["/members", "/settings"];
const AUTH_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (hasSession && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/members", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2)$).*)"],
};

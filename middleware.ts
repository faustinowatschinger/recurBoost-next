import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMockModeEnabled } from "@/lib/security/runtime";

export async function middleware(request: NextRequest) {
  if (isMockModeEnabled) {
    return NextResponse.next();
  }

  const isProtectedPath = [
    "/dashboard",
    "/settings",
    "/onboarding",
    "/billing",
  ].some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const sessionCookiePrefixes = [
    "__Host-authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ];

  const hasSessionCookie = request.cookies
    .getAll()
    .some(({ name }) =>
      sessionCookiePrefixes.some(
        (prefix) => name === prefix || name.startsWith(`${prefix}.`)
      )
    );

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/api/auth/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/billing/:path*",
  ],
};

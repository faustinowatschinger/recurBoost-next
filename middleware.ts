import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMockModeEnabled } from "@/lib/security/runtime";

export async function middleware(request: NextRequest) {
  if (isMockModeEnabled) {
    return NextResponse.next();
  }

  const hasSessionCookie = [
    "__Host-authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ].some((cookieName) => Boolean(request.cookies.get(cookieName)?.value));

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/billing/:path*",
  ],
};

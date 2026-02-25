import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMockModeEnabled } from "@/lib/security/runtime";

export async function middleware(request: NextRequest) {
  const canonicalUrlRaw = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

  if (process.env.NODE_ENV === "production" && canonicalUrlRaw) {
    try {
      const canonicalUrl = new URL(canonicalUrlRaw);
      const requestHost = request.nextUrl.host.toLowerCase();
      const canonicalHost = canonicalUrl.host.toLowerCase();

      if (requestHost !== canonicalHost) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.protocol = canonicalUrl.protocol;
        redirectUrl.host = canonicalUrl.host;
        return NextResponse.redirect(redirectUrl, 308);
      }
    } catch {
      // Invalid canonical URL: skip host normalization and continue.
    }
  }

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

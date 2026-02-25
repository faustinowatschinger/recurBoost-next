import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isMockModeEnabled } from "@/lib/security/runtime";

export async function middleware(request: NextRequest) {
  if (isMockModeEnabled) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const secureCookie = request.nextUrl.protocol === "https:";
  const token =
    (await getToken({ req: request, secret, secureCookie })) ||
    (await getToken({ req: request, secret, secureCookie: !secureCookie }));

  if (!token) {
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

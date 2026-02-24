import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (process.env.MOCK_DATA === "true") {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name === "authjs.session-token" ||
        name === "__Secure-authjs.session-token" ||
        name.startsWith("authjs.session-token.") ||
        name.startsWith("__Secure-authjs.session-token.")
    );

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

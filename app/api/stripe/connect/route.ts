import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  STRIPE_OAUTH_STATE_COOKIE,
  createStripeOAuthState,
} from "@/lib/security/oauth-state";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STRIPE_CLIENT_ID no configurado" },
      { status: 500 }
    );
  }

  let state: string;
  let nonce: string;
  let maxAgeSeconds: number;
  try {
    const stateData = createStripeOAuthState(session.user.id);
    state = stateData.state;
    nonce = stateData.nonce;
    maxAgeSeconds = stateData.maxAgeSeconds;
  } catch (err) {
    console.error("Stripe OAuth state configuration error:", err);
    return NextResponse.json(
      { error: "OAuth state secret is not configured" },
      { status: 500 }
    );
  }
  const appBaseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: `${appBaseUrl}/api/stripe/callback`,
    state,
  });

  const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: STRIPE_OAUTH_STATE_COOKIE,
    value: nonce,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
    path: "/",
  });

  return response;
}

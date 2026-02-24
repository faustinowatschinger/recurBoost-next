import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getStripeLegacy } from "@/lib/stripe/client";
import { connectDB } from "@/lib/db/connection";
import { StripeAccount } from "@/lib/db/models";
import { getBillingAccessState, startTrialForUser } from "@/lib/billing/service";
import { encrypt } from "@/lib/security/crypto";
import {
  STRIPE_OAUTH_STATE_COOKIE,
  verifyStripeOAuthState,
} from "@/lib/security/oauth-state";

function redirectWithStateCleanup(
  request: NextRequest,
  path: string
): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set({
    name: STRIPE_OAUTH_STATE_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirectWithStateCleanup(request, "/onboarding?error=unauthorized");
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const stripeError = searchParams.get("error");

  if (stripeError) {
    return redirectWithStateCleanup(
      request,
      `/onboarding?error=${encodeURIComponent(stripeError)}`
    );
  }

  if (!code || !stateParam) {
    return redirectWithStateCleanup(request, "/onboarding?error=missing_params");
  }

  const stateNonce = request.cookies.get(STRIPE_OAUTH_STATE_COOKIE)?.value;
  if (!stateNonce) {
    return redirectWithStateCleanup(request, "/onboarding?error=invalid_state");
  }

  let parsedState: ReturnType<typeof verifyStripeOAuthState>;
  try {
    parsedState = verifyStripeOAuthState(stateParam, stateNonce);
  } catch (err) {
    console.error("Stripe OAuth state verification error:", err);
    return redirectWithStateCleanup(request, "/onboarding?error=oauth_misconfigured");
  }

  if (!parsedState || parsedState.userId !== session.user.id) {
    return redirectWithStateCleanup(request, "/onboarding?error=invalid_state");
  }

  const userId = parsedState.userId;

  try {
    const response = await getStripeLegacy().oauth.token({
      grant_type: "authorization_code",
      code,
    });

    if (!response.stripe_user_id || !response.access_token) {
      return redirectWithStateCleanup(
        request,
        "/onboarding?error=stripe_response_invalid"
      );
    }

    await connectDB();

    await StripeAccount.findOneAndUpdate(
      { userId },
      {
        userId,
        stripeAccountId: response.stripe_user_id,
        accessToken: encrypt(response.access_token),
        refreshToken: response.refresh_token
          ? encrypt(response.refresh_token)
          : undefined,
      },
      { upsert: true, new: true }
    );

    await startTrialForUser(userId);

    const billing = await getBillingAccessState(userId, {
      autoExpireTrial: true,
    });
    if (!billing.canAccessProduct) {
      return redirectWithStateCleanup(request, "/billing");
    }

    const appBaseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    // Register webhooks for the connected account.
    try {
      const webhookEndpoint = await getStripeLegacy().webhookEndpoints.create(
        {
          url: `${appBaseUrl}/api/stripe/webhooks`,
          enabled_events: [
            "invoice.payment_failed",
            "invoice.paid",
            "customer.subscription.updated",
          ],
        },
        {
          stripeAccount: response.stripe_user_id,
        }
      );

      await StripeAccount.findOneAndUpdate(
        { userId },
        { webhookEndpointId: webhookEndpoint.id }
      );
    } catch (webhookError) {
      console.error("Error registering webhooks:", webhookError);
      // Do not fail the connection if webhook registration fails.
    }

    return redirectWithStateCleanup(request, "/onboarding?success=true");
  } catch (err) {
    console.error("Stripe OAuth error:", err);
    return redirectWithStateCleanup(request, "/onboarding?error=oauth_failed");
  }
}

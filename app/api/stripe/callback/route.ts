import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { connectDB } from "@/lib/db/connection";
import { StripeAccount } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/onboarding?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/onboarding?error=missing_params", request.url)
    );
  }

  let userId: string;
  try {
    const state = JSON.parse(
      Buffer.from(stateParam, "base64url").toString("utf-8")
    );
    userId = state.userId;
  } catch {
    return NextResponse.redirect(
      new URL("/onboarding?error=invalid_state", request.url)
    );
  }

  try {
    const response = await getStripe().oauth.token({
      grant_type: "authorization_code",
      code,
    });

    if (!response.stripe_user_id || !response.access_token) {
      return NextResponse.redirect(
        new URL("/onboarding?error=stripe_response_invalid", request.url)
      );
    }

    await connectDB();

    await StripeAccount.findOneAndUpdate(
      { userId },
      {
        userId,
        stripeAccountId: response.stripe_user_id,
        accessToken: response.access_token,
        refreshToken: response.refresh_token || undefined,
      },
      { upsert: true, new: true }
    );

    // Register webhooks for the connected account
    try {
      const webhookEndpoint = await getStripe().webhookEndpoints.create({
        url: `${process.env.NEXTAUTH_URL}/api/stripe/webhooks`,
        enabled_events: [
          "invoice.payment_failed",
          "invoice.paid",
          "customer.subscription.updated",
        ],
      }, {
        stripeAccount: response.stripe_user_id,
      });

      await StripeAccount.findOneAndUpdate(
        { userId },
        { webhookEndpointId: webhookEndpoint.id }
      );
    } catch (webhookError) {
      console.error("Error registering webhooks:", webhookError);
      // Don't fail the connection if webhook registration fails
    }

    return NextResponse.redirect(
      new URL("/onboarding?success=true", request.url)
    );
  } catch (err) {
    console.error("Stripe OAuth error:", err);
    return NextResponse.redirect(
      new URL("/onboarding?error=oauth_failed", request.url)
    );
  }
}

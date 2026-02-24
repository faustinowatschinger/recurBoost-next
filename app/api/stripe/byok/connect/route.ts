import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { encrypt, redactKey } from "@/lib/security/crypto";
import { getBillingAccessState, startTrialForUser } from "@/lib/billing/service";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { apiKey: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }

  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json(
      { error: "apiKey is required" },
      { status: 400 }
    );
  }

  // Basic format validation for Stripe secret keys
  if (!apiKey.startsWith("sk_test_") && !apiKey.startsWith("sk_live_") && !apiKey.startsWith("rk_test_") && !apiKey.startsWith("rk_live_")) {
    return NextResponse.json(
      { error: "The API key must be a valid Stripe Secret Key or Restricted Key (sk_test_*, sk_live_*, rk_test_*, rk_live_*)" },
      { status: 400 }
    );
  }

  // Validate the key by making a test API call
  // Use balance.retrieve() instead of accounts.retrieve() because restricted
  // keys (rk_*) typically don't have the "account" permission.
  let stripeAccountId: string;
  try {
    const stripe = new Stripe(apiKey);
    const balance = await stripe.balance.retrieve();
    // The balance object doesn't contain the account ID directly,
    // but if we reach here the key is valid. Extract account from a
    // lightweight call that restricted keys can access.
    // Try accounts.retrieve as a best-effort for the account ID.
    try {
      const account = await stripe.accounts.retrieve();
      stripeAccountId = account.id;
    } catch {
      // Restricted keys may not have account read permission.
      // Use a fallback: the livemode field tells us the key works,
      // and we store a placeholder account ID.
      stripeAccountId = balance.livemode ? "acct_live_restricted" : "acct_test_restricted";
    }
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeAuthenticationError
      ? "Invalid API key. Make sure the key is correct and active."
      : "Could not validate the API key with Stripe. Make sure the key has at least the balance read permission.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Optionally create a webhook endpoint automatically
  let webhookSecretEncrypted: string | undefined;
  let webhookEndpointId: string | undefined;

  try {
    const stripe = new Stripe(apiKey);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: `${baseUrl}/api/stripe/webhooks`,
      enabled_events: [
        "invoice.payment_failed",
        "invoice.paid",
        "customer.subscription.updated",
      ],
    });
    webhookEndpointId = webhookEndpoint.id;
    if (webhookEndpoint.secret) {
      webhookSecretEncrypted = encrypt(webhookEndpoint.secret);
    }
  } catch (err) {
    // Webhook creation is best-effort. If the key is restricted and doesn't
    // have webhook_endpoints write permission, the user can add the secret manually later.
    console.warn("Could not auto-create webhook endpoint:", err);
  }

  await connectDB();

  // Upsert: if user already has an integration, replace it
  const integration = await PaymentIntegration.findOneAndUpdate(
    { userId: session.user.id },
    {
      userId: session.user.id,
      provider: "stripe",
      mode: "byok",
      stripeAccountId,
      apiKeyEncrypted: encrypt(apiKey),
      apiKeyLast4: redactKey(apiKey),
      webhookSecretEncrypted,
      webhookEndpointId,
      status: "active",
      lastValidationAt: new Date(),
    },
    { upsert: true, new: true }
  );

  await startTrialForUser(session.user.id);

  const billing = await getBillingAccessState(session.user.id, {
    autoExpireTrial: true,
  });
  if (!billing.canAccessProduct) {
    await PaymentIntegration.findOneAndUpdate(
      { userId: session.user.id },
      { status: "disconnected" }
    );

    return NextResponse.json(
      {
        error:
          "Your trial has ended. Activate the plan to continue using recovery.",
      },
      { status: 402 }
    );
  }

  return NextResponse.json({
    success: true,
    stripeAccountId,
    apiKeyLast4: integration.apiKeyLast4,
    webhookConfigured: !!webhookEndpointId,
  });
}

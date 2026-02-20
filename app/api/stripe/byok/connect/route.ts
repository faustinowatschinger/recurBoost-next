import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { encrypt, redactKey } from "@/lib/security/crypto";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { apiKey: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido" },
      { status: 400 }
    );
  }

  const { apiKey } = body;

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json(
      { error: "Se requiere apiKey" },
      { status: 400 }
    );
  }

  // Basic format validation for Stripe secret keys
  if (!apiKey.startsWith("sk_test_") && !apiKey.startsWith("sk_live_") && !apiKey.startsWith("rk_test_") && !apiKey.startsWith("rk_live_")) {
    return NextResponse.json(
      { error: "La API key debe ser una Stripe Secret Key o Restricted Key válida (sk_test_*, sk_live_*, rk_test_*, rk_live_*)" },
      { status: 400 }
    );
  }

  // Validate the key by making a test API call
  let stripeAccountId: string;
  try {
    const stripe = new Stripe(apiKey);
    const account = await stripe.accounts.retrieve();
    stripeAccountId = account.id;
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeAuthenticationError
      ? "API key inválida. Verificá que la key sea correcta y esté activa."
      : "No se pudo validar la API key con Stripe. Intentá de nuevo.";
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

  return NextResponse.json({
    success: true,
    stripeAccountId,
    apiKeyLast4: integration.apiKeyLast4,
    webhookConfigured: !!webhookEndpointId,
  });
}

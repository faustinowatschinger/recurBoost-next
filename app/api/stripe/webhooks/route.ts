import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db/connection";
import {
  PaymentIntegration,
  RecoveryCase,
  ProcessedEvent,
} from "@/lib/db/models";
import { decrypt } from "@/lib/security/crypto";
import { classifyFailure, isHardDecline, isRetryableFailure } from "@/lib/stripe/classify";
import { triggerRecoverySequence } from "@/lib/recovery/engine";

/**
 * Resolve the PaymentIntegration that owns this webhook event.
 * Tries all active integrations and verifies the signature against each one's secret.
 */
async function resolveEventAndIntegration(
  body: string,
  signature: string
): Promise<{
  event: Stripe.Event;
  integration: InstanceType<typeof PaymentIntegration>;
} | null> {
  const integrations = await PaymentIntegration.find({
    status: "active",
    webhookSecretEncrypted: { $exists: true, $ne: null },
  });

  for (const integration of integrations) {
    try {
      const webhookSecret = decrypt(integration.webhookSecretEncrypted!);
      const stripe = new Stripe(decrypt(integration.apiKeyEncrypted));
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return { event, integration };
    } catch {
      // Signature didn't match this integration, try next
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  await connectDB();

  const result = await resolveEventAndIntegration(body, signature);

  if (!result) {
    console.warn("Webhook: no matching integration found for signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { event, integration } = result;

  // Idempotency: skip if already processed
  try {
    await ProcessedEvent.create({ eventId: event.id });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw err;
  }

  try {
    switch (event.type) {
      case "invoice.payment_failed":
        await handlePaymentFailed(
          event.data.object as Stripe.Invoice,
          integration,
          decrypt(integration.apiKeyEncrypted)
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        // Track subscription changes for MRR calculations
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return NextResponse.json(
      { error: "Processing error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  integration: InstanceType<typeof PaymentIntegration>,
  apiKey: string
) {
  // Don't create duplicates
  const existing = await RecoveryCase.findOne({
    stripeInvoiceId: invoice.id,
  });
  if (existing) return;

  // Extract decline code — retrieve PaymentIntent if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  let declineCode: string | null = null;

  const piRef = invoiceData.payment_intent;
  if (piRef) {
    try {
      if (typeof piRef === "string") {
        const stripe = new Stripe(apiKey);
        const pi = await stripe.paymentIntents.retrieve(piRef);
        declineCode = pi.last_payment_error?.decline_code || null;
      } else {
        declineCode = piRef.last_payment_error?.decline_code || null;
      }
    } catch (err) {
      console.warn("Could not retrieve PaymentIntent for decline code:", err);
    }
  }

  // Fallback to invoice-level error
  if (!declineCode) {
    declineCode = invoiceData.last_finalization_error?.code || null;
  }

  const failureType = classifyFailure(declineCode);
  const hardDecline = isHardDecline(failureType);
  const status = hardDecline ? "failed" : "active";

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id || "";

  // For retryable failures, schedule smart retry instead of immediate email
  const retryable = isRetryableFailure(failureType);
  const smartRetryScheduledFor = retryable
    ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
    : undefined;

  const recoveryCase = await RecoveryCase.create({
    userId: integration.userId,
    stripeAccountId: integration.stripeAccountId,
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId:
      (typeof invoiceData.subscription === "string"
        ? invoiceData.subscription
        : invoiceData.subscription?.id) || undefined,
    customerEmail: process.env.TEST_OVERRIDE_EMAIL || invoice.customer_email || "unknown@test.local",
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    failureType,
    declineCode: declineCode || undefined,
    status,
    smartRetryScheduledFor,
    smartRetryAttempted: retryable ? false : undefined,
    smartRetryResult: retryable ? undefined : "skipped",
  });

  // For retryable failures: wait for smart retry (cron will handle it)
  // For non-retryable, non-hard-decline: send email immediately
  if (status === "active" && !retryable) {
    try {
      await triggerRecoverySequence(recoveryCase);
    } catch (err) {
      console.error("Error in triggerRecoverySequence (non-fatal):", err);
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const recoveryCase = await RecoveryCase.findOne({
    stripeInvoiceId: invoice.id,
    recovered: false,
  });

  if (!recoveryCase) return;

  recoveryCase.recovered = true;
  recoveryCase.recoveredAmount = invoice.amount_paid / 100;
  recoveryCase.recoveredAt = new Date();
  recoveryCase.status = "recovered";
  await recoveryCase.save();
}

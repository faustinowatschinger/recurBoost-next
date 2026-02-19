import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db/connection";
import { StripeAccount, RecoveryCase } from "@/lib/db/models";
import { classifyFailure } from "@/lib/stripe/classify";
import { triggerRecoverySequence } from "@/lib/recovery/engine";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  // Find the connected account for this event
  const connectedAccountId = event.account;
  if (!connectedAccountId) {
    return NextResponse.json({ received: true });
  }

  const stripeAccount = await StripeAccount.findOne({
    stripeAccountId: connectedAccountId,
  });

  if (!stripeAccount) {
    console.warn(`No account found for Stripe ID: ${connectedAccountId}`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice, stripeAccount);
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
  stripeAccount: { userId: string; stripeAccountId: string }
) {
  // Don't create duplicates
  const existing = await RecoveryCase.findOne({
    stripeInvoiceId: invoice.id,
  });
  if (existing) return;

  // Extract decline code from the invoice's payment intent or last error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const declineCode =
    invoiceData.last_finalization_error?.code ||
    invoiceData.payment_intent?.last_payment_error?.decline_code ||
    null;

  const failureType = classifyFailure(declineCode);

  // Don't start recovery for hard declines — wait for new payment method
  const status = failureType === "HARD_DECLINE" ? "failed" : "active";

  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id || "";

  const recoveryCase = await RecoveryCase.create({
    userId: stripeAccount.userId,
    stripeAccountId: stripeAccount.stripeAccountId,
    stripeInvoiceId: invoice.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: invoiceData.subscription || undefined,
    customerEmail: invoice.customer_email || "",
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    failureType,
    declineCode: declineCode || undefined,
    status,
  });

  // Trigger recovery email sequence for non-hard-declines
  if (status === "active") {
    await triggerRecoverySequence(recoveryCase);
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

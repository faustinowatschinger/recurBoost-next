import Stripe from "stripe";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { decrypt } from "@/lib/security/crypto";

const DAYS_TO_IMPORT = 90;
const MAX_INVOICES_PER_STATUS = 10_000; // Safety limit to prevent runaway iteration

interface BaselineResult {
  totalFailed: number;
  totalRecovered: number;
  recoveryRate: number;
  truncated?: boolean;
}

/**
 * Import historical invoice data from the last 90 days to calculate
 * the baseline recovery rate (before our service was active).
 * Now uses BYOK PaymentIntegration instead of legacy StripeAccount.
 */
export async function calculateBaseline(userId: string): Promise<BaselineResult> {
  await connectDB();

  const integration = await PaymentIntegration.findOne({
    userId,
    status: "active",
  });
  if (!integration) {
    throw new Error("No active Stripe integration found");
  }

  const apiKey = decrypt(integration.apiKeyEncrypted);
  const stripe = new Stripe(apiKey);

  const sinceTimestamp = Math.floor(
    (Date.now() - DAYS_TO_IMPORT * 24 * 60 * 60 * 1000) / 1000
  );

  let totalFailed = 0;
  let totalRecovered = 0;
  let totalProcessed = 0;
  let truncated = false;

  // Helper to enforce safety limit across all status queries
  const canContinue = () => {
    if (totalProcessed >= MAX_INVOICES_PER_STATUS * 3) {
      truncated = true;
      return false;
    }
    return true;
  };

  // Count paid invoices that had at least one failed attempt (then recovered)
  const paidParams: Stripe.InvoiceListParams = {
    created: { gte: sinceTimestamp },
    limit: 100,
    status: "paid",
  };

  for await (const invoice of stripe.invoices.list(paidParams)) {
    totalProcessed++;
    if (!canContinue()) break;
    if (invoice.attempted && invoice.attempt_count > 1) {
      totalFailed++;
      totalRecovered++;
    }
  }

  // Count currently open invoices with failed attempts
  const openParams: Stripe.InvoiceListParams = {
    created: { gte: sinceTimestamp },
    limit: 100,
    status: "open",
  };

  for await (const invoice of stripe.invoices.list(openParams)) {
    totalProcessed++;
    if (!canContinue()) break;
    if (invoice.attempted && invoice.attempt_count > 0) {
      totalFailed++;
    }
  }

  // Count uncollectible invoices (permanent failures)
  const uncollectibleParams: Stripe.InvoiceListParams = {
    created: { gte: sinceTimestamp },
    limit: 100,
    status: "uncollectible",
  };

  for await (const _invoice of stripe.invoices.list(uncollectibleParams)) {
    totalProcessed++;
    if (!canContinue()) break;
    totalFailed++;
  }

  const recoveryRate = totalFailed > 0
    ? (totalRecovered / totalFailed) * 100
    : 0;

  // Save baseline to PaymentIntegration (saves even if rate is 0)
  integration.baselineRecoveryRate = Math.round(recoveryRate * 100) / 100;
  integration.baselineCalculatedAt = new Date();
  await integration.save();

  return {
    totalFailed,
    totalRecovered,
    recoveryRate: integration.baselineRecoveryRate,
    truncated,
  };
}

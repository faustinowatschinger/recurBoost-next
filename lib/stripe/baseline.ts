import Stripe from "stripe";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { decrypt } from "@/lib/security/crypto";

const DAYS_TO_IMPORT = 90;

interface BaselineResult {
  totalFailed: number;
  totalRecovered: number;
  recoveryRate: number;
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

  // Fetch all invoices from the last 90 days
  const invoiceParams: Stripe.InvoiceListParams = {
    created: { gte: sinceTimestamp },
    limit: 100,
    status: "paid",
  };

  // Count paid invoices that had at least one failed attempt
  for await (const invoice of stripe.invoices.list(invoiceParams)) {
    if (invoice.attempted && invoice.attempt_count > 1) {
      totalFailed++;
      totalRecovered++;
    }
  }

  // Also count currently open invoices that failed
  const failedParams: Stripe.InvoiceListParams = {
    created: { gte: sinceTimestamp },
    limit: 100,
    status: "open",
  };

  for await (const invoice of stripe.invoices.list(failedParams)) {
    if (invoice.attempted && invoice.attempt_count > 0) {
      totalFailed++;
    }
  }

  // Also check uncollectible invoices
  const uncollectibleList = await stripe.invoices.list({
    created: { gte: sinceTimestamp },
    limit: 100,
    status: "uncollectible",
  });
  totalFailed += uncollectibleList.data.length;

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
  };
}

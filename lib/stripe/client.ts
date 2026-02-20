import Stripe from "stripe";
import { connectDB } from "@/lib/db/connection";
import { PaymentIntegration } from "@/lib/db/models";
import { decrypt } from "@/lib/security/crypto";

/**
 * Returns a Stripe client configured with the user's own API key (BYOK).
 * Looks up the active PaymentIntegration for the given userId,
 * decrypts the stored API key, and returns a Stripe instance.
 */
export async function getStripeForUser(userId: string): Promise<Stripe> {
  await connectDB();

  const integration = await PaymentIntegration.findOne({
    userId,
    status: "active",
  });

  if (!integration) {
    throw new Error("No active Stripe integration found for this user");
  }

  const apiKey = decrypt(integration.apiKeyEncrypted);
  return new Stripe(apiKey);
}

/**
 * Returns a Stripe client for a specific integration document.
 * Useful when you already have the integration loaded.
 */
export function getStripeForIntegration(apiKeyEncrypted: string): Stripe {
  const apiKey = decrypt(apiKeyEncrypted);
  return new Stripe(apiKey);
}

/**
 * Legacy: Returns a Stripe client using the global STRIPE_SECRET_KEY.
 * Only used if Connect OAuth flow is still active.
 */
let _stripeLegacy: Stripe | null = null;

export function getStripeLegacy(): Stripe {
  if (!_stripeLegacy) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not defined");
    }
    _stripeLegacy = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripeLegacy;
}

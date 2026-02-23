import Stripe from "stripe";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { User, RecoveryCase, PaymentIntegration } from "@/lib/db/models";
import type { IUser } from "@/lib/db/models";
import {
  BILLING_CURRENCY,
  BILLING_PLAN_AMOUNT_CENTS,
  BILLING_PLAN_AMOUNT_USD,
  BILLING_PLAN_NAME,
  BILLING_TRIAL_DAYS,
  getBillingAppBaseUrl,
} from "@/lib/billing/config";
import { sendTrialEndedBillingEmail } from "@/lib/email/billing";

export type BillingViewStatus = "not_started" | "trialing" | "active" | "canceled";

export interface BillingAccessState {
  billingStatus: BillingViewStatus;
  canAccessProduct: boolean;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  recoveredDuringTrial: number;
  reachedMinimumCharge: boolean;
  paymentRequired: boolean;
  stripeSubscriptionStatus: string | null;
}

const PLAN_MINIMUM_RECOVERY_TO_CHARGE = BILLING_PLAN_AMOUNT_USD;
const PAID_PLAN_STATUSES = new Set(["active", "trialing"]);
const CANCELED_PLAN_STATUSES = new Set([
  "canceled",
  "unpaid",
  "past_due",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

let _billingStripe: Stripe | null = null;

function getBillingStripe(): Stripe {
  if (!_billingStripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY no configurado para billing");
    }
    _billingStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _billingStripe;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

async function getRecoveredAmountForRange(
  userObjectId: Types.ObjectId,
  start: Date,
  end: Date
): Promise<number> {
  const result = await RecoveryCase.aggregate<{ total: number }>([
    {
      $match: {
        userId: userObjectId,
        recovered: true,
        recoveredAmount: { $gt: 0 },
        recoveredAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$recoveredAmount" },
      },
    },
  ]);

  return roundMoney(result[0]?.total ?? 0);
}

async function getTrialRecoveredAmount(user: IUser): Promise<number> {
  if (user.trialRecoveredAmount != null && user.billingStatus === "canceled") {
    return roundMoney(user.trialRecoveredAmount);
  }

  if (!user.trialStartedAt) return 0;

  const now = new Date();
  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : now;
  const end = trialEnd.getTime() < now.getTime() ? trialEnd : now;

  if (end.getTime() <= new Date(user.trialStartedAt).getTime()) {
    return 0;
  }

  return getRecoveredAmountForRange(
    new Types.ObjectId(user._id.toString()),
    new Date(user.trialStartedAt),
    end
  );
}

function getBillingStatusView(user: IUser): BillingViewStatus {
  if (user.billingStatus) {
    return user.billingStatus;
  }
  return user.trialStartedAt ? "trialing" : "not_started";
}

async function expireTrialIfNeeded(user: IUser): Promise<boolean> {
  const billingStatus = getBillingStatusView(user);
  if (billingStatus !== "trialing") return false;
  if (!user.trialEndsAt) return false;

  const now = new Date();
  if (new Date(user.trialEndsAt).getTime() > now.getTime()) {
    return false;
  }

  const recoveredDuringTrial = await getTrialRecoveredAmount(user);
  const reachedMinimumCharge =
    recoveredDuringTrial >= PLAN_MINIMUM_RECOVERY_TO_CHARGE;

  user.billingStatus = "canceled";
  user.billingCanceledAt = now;
  user.billingCancellationReason = reachedMinimumCharge
    ? "trial_ended_payment_required"
    : "trial_ended_below_threshold";
  user.trialRecoveredAmount = recoveredDuringTrial;

  await user.save();

  await PaymentIntegration.findOneAndUpdate(
    { userId: user._id, status: "active" },
    { status: "disconnected" }
  );

  await RecoveryCase.updateMany(
    { userId: user._id, status: "active", recovered: false },
    { status: "cancelled" }
  );

  if (!user.trialSummaryEmailSentAt) {
    const paymentUrl = `${getBillingAppBaseUrl()}/billing`;
    try {
      await sendTrialEndedBillingEmail({
        to: user.email,
        companyName: user.companyName,
        recoveredAmount: recoveredDuringTrial,
        paymentUrl,
        reachedMinimumCharge,
      });
      user.trialSummaryEmailSentAt = new Date();
      await user.save();
    } catch (err) {
      console.error("No se pudo enviar email de fin de trial:", err);
    }
  }

  return true;
}

function mapSubscriptionToBillingStatus(status: Stripe.Subscription.Status): "active" | "canceled" {
  if (PAID_PLAN_STATUSES.has(status)) return "active";
  if (CANCELED_PLAN_STATUSES.has(status)) return "canceled";
  return "canceled";
}

async function findUserByStripeCustomerId(customerId: string): Promise<IUser | null> {
  return await User.findOne({ stripeBillingCustomerId: customerId });
}

export async function startTrialForUser(userId: string): Promise<void> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) return;

  const currentStatus = getBillingStatusView(user);
  if (currentStatus === "active") return;
  if (user.trialStartedAt) {
    if (!user.billingStatus) {
      user.billingStatus = "trialing";
      await user.save();
    }
    return;
  }

  const now = new Date();
  user.billingStatus = "trialing";
  user.trialStartedAt = now;
  user.trialEndsAt = addDays(now, BILLING_TRIAL_DAYS);
  user.trialRecoveredAmount = undefined;
  user.trialSummaryEmailSentAt = undefined;
  user.billingCanceledAt = undefined;
  user.billingCancellationReason = undefined;
  await user.save();
}

export async function getBillingAccessState(
  userId: string,
  options?: { autoExpireTrial?: boolean }
): Promise<BillingAccessState> {
  await connectDB();

  let user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (options?.autoExpireTrial !== false) {
    const expired = await expireTrialIfNeeded(user);
    if (expired) {
      const refreshed = await User.findById(userId);
      if (!refreshed) throw new Error("Usuario no encontrado");
      user = refreshed;
    }
  }

  const billingStatus = getBillingStatusView(user);
  const recoveredDuringTrial = await getTrialRecoveredAmount(user);
  const reachedMinimumCharge =
    recoveredDuringTrial >= PLAN_MINIMUM_RECOVERY_TO_CHARGE;

  const now = Date.now();
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil((trialEndsAt.getTime() - now) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const canAccessProduct =
    billingStatus === "active" ||
    billingStatus === "trialing" ||
    billingStatus === "not_started";

  const paymentRequired = billingStatus === "canceled" && reachedMinimumCharge;

  return {
    billingStatus,
    canAccessProduct,
    trialStartedAt: user.trialStartedAt ? new Date(user.trialStartedAt) : null,
    trialEndsAt,
    trialDaysLeft,
    recoveredDuringTrial,
    reachedMinimumCharge,
    paymentRequired,
    stripeSubscriptionStatus: user.stripeBillingSubscriptionStatus || null,
  };
}

export async function createBillingCheckoutSession(
  userId: string
): Promise<string> {
  await connectDB();

  const billingState = await getBillingAccessState(userId, {
    autoExpireTrial: true,
  });

  if (billingState.billingStatus === "active") {
    throw new Error("PLAN_ALREADY_ACTIVE");
  }

  if (!billingState.reachedMinimumCharge) {
    throw new Error("MINIMUM_RECOVERY_NOT_REACHED");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const stripe = getBillingStripe();

  let customerId = user.stripeBillingCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.companyName || undefined,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    user.stripeBillingCustomerId = customer.id;
    await user.save();
  }

  const baseUrl = getBillingAppBaseUrl();
  const priceId = process.env.STRIPE_BILLING_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: BILLING_CURRENCY,
              unit_amount: BILLING_PLAN_AMOUNT_CENTS,
              recurring: { interval: "month" },
              product_data: {
                name: BILLING_PLAN_NAME,
              },
            },
            quantity: 1,
          },
        ],
    success_url: `${baseUrl}/billing?checkout=success`,
    cancel_url: `${baseUrl}/billing?checkout=cancel`,
    metadata: { userId: user._id.toString() },
    subscription_data: {
      metadata: { userId: user._id.toString() },
    },
  });

  if (!session.url) {
    throw new Error("CHECKOUT_URL_NOT_AVAILABLE");
  }

  return session.url;
}

export async function createBillingPortalSession(userId: string): Promise<string> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user?.stripeBillingCustomerId) {
    throw new Error("BILLING_CUSTOMER_NOT_FOUND");
  }

  const stripe = getBillingStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeBillingCustomerId,
    return_url: `${getBillingAppBaseUrl()}/billing`,
  });

  return session.url;
}

export async function syncUserFromBillingSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  await connectDB();

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const userIdFromMetadata = subscription.metadata?.userId;

  let user = userIdFromMetadata
    ? await User.findById(userIdFromMetadata)
    : null;

  if (!user && customerId) {
    user = await findUserByStripeCustomerId(customerId);
  }

  if (!user) {
    console.warn(
      `Billing webhook: usuario no encontrado para subscription ${subscription.id}`
    );
    return;
  }

  const mappedStatus = mapSubscriptionToBillingStatus(subscription.status);

  user.stripeBillingCustomerId = customerId;
  user.stripeBillingSubscriptionId = subscription.id;
  user.stripeBillingSubscriptionStatus = subscription.status;
  user.billingStatus = mappedStatus;

  if (mappedStatus === "active") {
    user.billingCanceledAt = undefined;
    user.billingCancellationReason = undefined;
    await PaymentIntegration.findOneAndUpdate(
      { userId: user._id, status: "disconnected" },
      { status: "active" }
    );
  } else {
    user.billingCanceledAt = new Date();
    user.billingCancellationReason = `subscription_${subscription.status}`;
    await PaymentIntegration.findOneAndUpdate(
      { userId: user._id, status: "active" },
      { status: "disconnected" }
    );
    await RecoveryCase.updateMany(
      { userId: user._id, status: "active", recovered: false },
      { status: "cancelled" }
    );
  }

  await user.save();
}

export async function handleBillingCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  await connectDB();

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const userIdFromMetadata = session.metadata?.userId;

  let user = userIdFromMetadata ? await User.findById(userIdFromMetadata) : null;
  if (!user && customerId) {
    user = await findUserByStripeCustomerId(customerId);
  }

  if (!user) {
    console.warn(`Checkout completed sin usuario asociado. Session=${session.id}`);
    return;
  }

  if (customerId) {
    user.stripeBillingCustomerId = customerId;
  }
  if (subscriptionId) {
    user.stripeBillingSubscriptionId = subscriptionId;
  }
  user.billingStatus = "active";
  user.billingCanceledAt = undefined;
  user.billingCancellationReason = undefined;
  await user.save();

  await PaymentIntegration.findOneAndUpdate(
    { userId: user._id, status: "disconnected" },
    { status: "active" }
  );

  if (subscriptionId) {
    try {
      const subscription = await getBillingStripe().subscriptions.retrieve(
        subscriptionId
      );
      await syncUserFromBillingSubscription(subscription);
    } catch (err) {
      console.error("No se pudo sincronizar subscription post-checkout:", err);
    }
  }
}

export async function processExpiredTrials(): Promise<{
  processed: number;
  canceled: number;
}> {
  await connectDB();

  const users = await User.find({
    trialEndsAt: { $lte: new Date() },
    $or: [{ billingStatus: "trialing" }, { billingStatus: { $exists: false } }],
  });

  let canceled = 0;
  for (const user of users) {
    const didCancel = await expireTrialIfNeeded(user);
    if (didCancel) canceled++;
  }

  return {
    processed: users.length,
    canceled,
  };
}

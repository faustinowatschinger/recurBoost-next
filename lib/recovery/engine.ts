import { createHmac } from "crypto";
import { getStripeForUser } from "@/lib/stripe/client";
import { getResend, isEmailConfigured } from "@/lib/email/resend";
import { getEmailTypeForFailure, EMAIL_SEQUENCES } from "@/lib/email/sequences";
import { getEmailHtml } from "@/lib/email/templates";
import { connectDB } from "@/lib/db/connection";
import { User, RecoveryCase, EmailSent } from "@/lib/db/models";
import type { IRecoveryCase } from "@/lib/db/models";
import type { SequenceStep } from "@/lib/types";

const RECOVERY_TOKEN_SECRET = process.env.APP_ENCRYPTION_KEY || "dev-secret-key";

export function generateRecoveryToken(caseId: string): string {
  return createHmac("sha256", RECOVERY_TOKEN_SECRET)
    .update(caseId)
    .digest("hex");
}

export function verifyRecoveryToken(caseId: string, token: string): boolean {
  const expected = generateRecoveryToken(caseId);
  return token === expected;
}

/**
 * Generate a fresh Stripe Billing Portal URL with deep link to payment method update.
 * Generated fresh each time to avoid stale expired URLs.
 */
async function generatePortalUrl(
  stripeCustomerId: string,
  userId: string,
  caseId: string
): Promise<string> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const stripe = await getStripeForUser(userId);
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/recovery/confirmed?caseId=${caseId}`,
      flow_data: {
        type: "payment_method_update",
      },
    });
    return session.url;
  } catch (err) {
    console.error("Error generating portal URL with deep link, falling back:", err);
    // Fallback: try without flow_data (older Stripe configs may not support it)
    try {
      const stripe = await getStripeForUser(userId);
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${baseUrl}/recovery/confirmed?caseId=${caseId}`,
      });
      return session.url;
    } catch (fallbackErr) {
      console.error("Error generating portal URL (fallback):", fallbackErr);
      return baseUrl;
    }
  }
}

export async function triggerRecoverySequence(recoveryCase: IRecoveryCase) {
  const emailType = getEmailTypeForFailure(recoveryCase.failureType);
  if (!emailType) return;

  await sendRecoveryEmail(recoveryCase, 0);
}

export async function sendRecoveryEmail(
  recoveryCase: IRecoveryCase,
  step: SequenceStep
) {
  try {
    await connectDB();

    const emailType = getEmailTypeForFailure(recoveryCase.failureType);
    if (!emailType) return;

    const sequence = EMAIL_SEQUENCES[emailType];
    const stepConfig = sequence.steps.find((s) => s.step === step);
    if (!stepConfig) return;

    // Check if already sent this step
    const alreadySent = await EmailSent.findOne({
      recoveryCaseId: recoveryCase._id,
      step,
    });
    if (alreadySent) return;

    // Check if already recovered
    if (recoveryCase.recovered) return;

    const user = await User.findById(recoveryCase.userId);
    if (!user) return;

    // Generate recovery token for landing page auth
    const caseId = recoveryCase._id.toString();
    const recoveryToken = generateRecoveryToken(caseId);
    if (!recoveryCase.recoveryToken) {
      recoveryCase.recoveryToken = recoveryToken;
    }

    // Build landing page URL (generates fresh portal URL on click)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const landingUrl = `${baseUrl}/recovery/${caseId}?token=${recoveryToken}`;

    // Tracking URL wraps the landing page URL
    const trackingUrl = `${baseUrl}/api/emails/track/click?caseId=${caseId}&step=${step}&redirect=${encodeURIComponent(landingUrl)}`;

    // Open tracking pixel URL
    const openPixelUrl = `${baseUrl}/api/emails/track/open?caseId=${caseId}&step=${step}`;

    // Load user incentive config for final step
    const isFinalStep = stepConfig.isFinalWarning === true;

    const html = getEmailHtml(emailType, step, {
      companyName: user.companyName || "Tu proveedor",
      companyLogo: user.companyLogo,
      senderName: user.senderName || user.companyName || "Soporte",
      portalUrl: trackingUrl,
      amount: recoveryCase.amount.toString(),
      currency: recoveryCase.currency,
      brandColor: user.brandColor,
      brandButtonColor: user.brandButtonColor,
      brandButtonTextColor: user.brandButtonTextColor,
      preheader: stepConfig.preheader,
      openPixelUrl,
      showIncentive: isFinalStep && user.incentiveEnabled === true,
      incentiveText: user.incentiveText || "Si actualizás hoy, mantenés el precio actual.",
    });

    // If Resend is not configured, log the email instead of sending
    if (!isEmailConfigured()) {
      console.log(`[DEV] Email would be sent:`);
      console.log(`  To: ${recoveryCase.customerEmail}`);
      console.log(`  Subject: ${stepConfig.subject}`);
      console.log(`  Type: ${emailType}, Step: ${step}`);

      await EmailSent.create({
        recoveryCaseId: recoveryCase._id,
        userId: recoveryCase.userId,
        emailType,
        step,
        to: recoveryCase.customerEmail,
        subject: stepConfig.subject,
        resendId: "dev-mode-no-send",
      });

      recoveryCase.currentStep = step;
      await recoveryCase.save();
      return;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
    const fromName = user.senderName || user.companyName || "Soporte";

    const result = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recoveryCase.customerEmail,
      subject: stepConfig.subject,
      html,
    });

    await EmailSent.create({
      recoveryCaseId: recoveryCase._id,
      userId: recoveryCase.userId,
      emailType,
      step,
      to: recoveryCase.customerEmail,
      subject: stepConfig.subject,
      resendId: result.data?.id,
    });

    recoveryCase.currentStep = step;
    await recoveryCase.save();
  } catch (err) {
    console.error(`Error sending recovery email step ${step}:`, err);
  }
}

/**
 * Process pending email sequences — call this via a cron job or scheduled task.
 * Checks all active recovery cases and sends the next email if the timing is right.
 */
export async function processEmailSequences() {
  await connectDB();

  const activeCases = await RecoveryCase.find({
    status: "active",
    recovered: false,
  });

  const now = Date.now();

  for (const recoveryCase of activeCases) {
    // Skip cases waiting for smart retry
    if (recoveryCase.smartRetryScheduledFor && !recoveryCase.smartRetryAttempted) {
      continue;
    }

    const emailType = getEmailTypeForFailure(recoveryCase.failureType);
    if (!emailType) continue;

    const sequence = EMAIL_SEQUENCES[emailType];
    const nextStep = (recoveryCase.currentStep + 1) as SequenceStep;

    const nextStepConfig = sequence.steps.find((s) => s.step === nextStep);
    if (!nextStepConfig) continue; // All steps sent

    const caseCreatedAt = new Date(recoveryCase.createdAt).getTime();
    const daysSinceCreation = (now - caseCreatedAt) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation >= nextStepConfig.day) {
      await sendRecoveryEmail(recoveryCase, nextStep);
    }
  }
}

/**
 * Process smart retries for retryable failures.
 * Called via cron before processEmailSequences.
 * Attempts to pay the invoice via Stripe API. If it fails, triggers the email sequence.
 */
export async function processSmartRetries(): Promise<{ processed: number; succeeded: number; failed: number }> {
  await connectDB();

  const pendingRetries = await RecoveryCase.find({
    status: "active",
    recovered: false,
    smartRetryAttempted: false,
    smartRetryScheduledFor: { $lte: new Date() },
  });

  let succeeded = 0;
  let failed = 0;

  for (const recoveryCase of pendingRetries) {
    try {
      const stripe = await getStripeForUser(recoveryCase.userId.toString());

      const invoice = await stripe.invoices.pay(recoveryCase.stripeInvoiceId);

      if (invoice.status === "paid") {
        recoveryCase.smartRetryAttempted = true;
        recoveryCase.smartRetryResult = "succeeded";
        await recoveryCase.save();
        succeeded++;
      } else {
        recoveryCase.smartRetryAttempted = true;
        recoveryCase.smartRetryResult = "failed";
        await recoveryCase.save();
        await triggerRecoverySequence(recoveryCase);
        failed++;
      }
    } catch (err) {
      console.error(`Smart retry failed for case ${recoveryCase._id}:`, err);
      recoveryCase.smartRetryAttempted = true;
      recoveryCase.smartRetryResult = "failed";
      await recoveryCase.save();

      try {
        await triggerRecoverySequence(recoveryCase);
      } catch (seqErr) {
        console.error(`Failed to trigger sequence after retry failure:`, seqErr);
      }
      failed++;
    }
  }

  return { processed: pendingRetries.length, succeeded, failed };
}

/**
 * Generate a fresh portal URL for a recovery case.
 * Used by the recovery landing page to create a non-stale Stripe portal session.
 */
export async function generateFreshPortalUrl(
  recoveryCase: IRecoveryCase
): Promise<string> {
  return generatePortalUrl(
    recoveryCase.stripeCustomerId,
    recoveryCase.userId.toString(),
    recoveryCase._id.toString()
  );
}

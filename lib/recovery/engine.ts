import { getStripe } from "@/lib/stripe/client";
import { getResend } from "@/lib/email/resend";
import { getEmailTypeForFailure, EMAIL_SEQUENCES } from "@/lib/email/sequences";
import { getEmailHtml } from "@/lib/email/templates";
import { connectDB } from "@/lib/db/connection";
import { User, RecoveryCase, EmailSent } from "@/lib/db/models";
import type { IRecoveryCase } from "@/lib/db/models";
import type { SequenceStep } from "@/lib/types";

async function generatePortalUrl(
  stripeCustomerId: string,
  stripeAccountId: string
): Promise<string> {
  try {
    const session = await getStripe().billingPortal.sessions.create(
      {
        customer: stripeCustomerId,
        return_url: process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
      { stripeAccount: stripeAccountId }
    );
    return session.url;
  } catch (err) {
    console.error("Error generating portal URL:", err);
    return `https://billing.stripe.com/p/login/${stripeAccountId}`;
  }
}

export async function triggerRecoverySequence(recoveryCase: IRecoveryCase) {
  const emailType = getEmailTypeForFailure(recoveryCase.failureType);
  if (!emailType) return; // e.g., HARD_DECLINE

  await sendRecoveryEmail(recoveryCase, 0);
}

export async function sendRecoveryEmail(
  recoveryCase: IRecoveryCase,
  step: SequenceStep
) {
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

  // Generate portal URL if not yet generated
  let portalUrl = recoveryCase.portalUrl;
  if (!portalUrl) {
    portalUrl = await generatePortalUrl(
      recoveryCase.stripeCustomerId,
      recoveryCase.stripeAccountId
    );
    recoveryCase.portalUrl = portalUrl;
    await recoveryCase.save();
  }

  const trackingUrl = `${process.env.NEXTAUTH_URL}/api/emails/track/click?caseId=${recoveryCase._id}&step=${step}&redirect=${encodeURIComponent(portalUrl)}`;

  const html = getEmailHtml(emailType, step, {
    companyName: user.companyName || "Tu proveedor",
    companyLogo: user.companyLogo,
    senderName: user.senderName || user.companyName || "Soporte",
    portalUrl: trackingUrl,
    amount: recoveryCase.amount.toString(),
    currency: recoveryCase.currency,
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
  const fromName = user.senderName || user.companyName || "Soporte";

  try {
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

import type { EmailType, SequenceStep } from "@/lib/types";

interface TemplateParams {
  companyName: string;
  companyLogo?: string;
  senderName: string;
  portalUrl: string;
  amount: string;
  currency: string;
  brandColor?: string;
  brandButtonColor?: string;
  brandButtonTextColor?: string;
  preheader?: string;
  openPixelUrl?: string;
  showIncentive?: boolean;
  incentiveText?: string;
}

interface WrapOptions {
  ctaText?: string;
  showExitOption?: boolean;
}

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(num);
}

function wrapHtml(body: string, params: TemplateParams, options: WrapOptions = {}): string {
  const buttonColor = params.brandButtonColor || "#635bff";
  const buttonTextColor = params.brandButtonTextColor || "#ffffff";
  const brandColor = params.brandColor || "#635bff";
  const ctaText = options.ctaText || "Update payment method";

  const logoHtml = params.companyLogo
    ? `<img src="${params.companyLogo}" alt="${params.companyName}" style="max-height:40px;margin-bottom:16px;" />`
    : `<h2 style="margin:0 0 16px;color:${brandColor};font-size:18px;line-height:1.2;">${params.companyName}</h2>`;

  const preheader = params.preheader || "";
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;">
        ${preheader.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </div>`
    : "";

  const incentiveHtml = params.showIncentive && params.incentiveText
    ? `<div style="margin-top:16px;padding:14px;border:2px solid #f59e0b;border-radius:10px;background:#fffbeb;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#92400e;">💡 Special offer</p>
        <p style="margin:0;font-size:13px;color:#78350f;">${params.incentiveText}</p>
      </div>`
    : "";

  const exitOptionHtml = options.showExitOption
    ? `<p style="margin-top:16px;font-size:12px;color:#9ca3af;text-align:center;">
        If you no longer need the service, you can ignore this email.
      </p>`
    : "";

  const openPixelHtml = params.openPixelUrl
    ? `<img src="${params.openPixelUrl}" width="1" height="1" style="display:none;" alt="" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f7fb;padding:28px;margin:0;">
  ${hiddenPreheader}
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e7e7ef;">
    ${logoHtml}

    <div style="font-size:15px;line-height:1.55;color:#1f2937;">
      ${body}
    </div>

    ${incentiveHtml}

    <div style="margin-top:20px;text-align:center;">
      <a href="${params.portalUrl}" style="display:block;width:100%;max-width:400px;margin:0 auto;padding:16px 24px;background:${buttonColor};color:${buttonTextColor};text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;text-align:center;box-sizing:border-box;">
        ${ctaText}
      </a>
      <p style="margin-top:8px;font-size:12px;color:#9ca3af;">
        This link is secure and works only for your account.
      </p>
      <div style="margin-top:6px;font-size:11px;color:#d1d5db;">
        If the button doesn't work, copy and paste this link: <br/>
        <span style="word-break:break-all;color:#9ca3af;">${params.portalUrl}</span>
      </div>
    </div>

    <div style="margin-top:18px;padding:14px;border:1px solid #eef0f6;border-radius:10px;background:#fafbff;">
      <div style="font-size:13px;color:#374151;">
        Need help? Reply to this email and we'll assist you.
      </div>
    </div>

    ${exitOptionHtml}

    <p style="margin-top:22px;font-size:12px;color:#9ca3af;">
      This email was sent by ${params.companyName}. If you've already updated your payment method, you can ignore it.
    </p>
  </div>
  ${openPixelHtml}
</body>
</html>`;
}

// ─── Helper: anxiety reduction block ───
function anxietyBlock(): string {
  return `<ul style="margin:0 0 12px;padding-left:18px;font-size:14px;line-height:1.8;color:#374151;">
      <li>Takes less than 1 minute</li>
      <li>Your plan stays the same</li>
      <li>You won't lose any settings or data</li>
      <li>No additional charges</li>
    </ul>`;
}

// ════════════════════════════════════════════════════
// EXPIRED CARD TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const EXPIRED_CARD_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      We couldn't process your payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> because your card has <strong>expired</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Your subscription is still active. You just need to update your payment method to keep everything running.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Fix this now" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Quick reminder: we still can't charge <strong>${formatCurrency(p.amount, p.currency)}</strong> because your card is expired.
    </p>
    <p style="margin:0 0 12px;">
      One step and you're all set. It's the same secure process as always.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirm payment method" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      It's been 3 days and we still haven't been able to charge <strong>${formatCurrency(p.amount, p.currency)}</strong>.
      Your card is still showing as expired.
    </p>
    <p style="margin:0 0 12px;">
      Update your payment method to avoid any interruptions to your service.
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Just one step</li>
      <li>No phone calls or complicated forms</li>
      <li>Your subscription stays exactly the same</li>
    </ul>
  `, p, { ctaText: "Keep my subscription active" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> is still pending due to an expired card.
      <strong>Your access may be suspended soon</strong> if this isn't resolved.
    </p>
    <p style="margin:0 0 12px;">
      You still have time. Update your card and everything continues as normal.
    </p>
  `, p, { ctaText: "Keep my subscription active", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      <strong>Final notice:</strong> we're suspending your subscription tomorrow if the payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> isn't completed.
    </p>
    <p style="margin:0 0 12px;">
      You won't lose your settings or data. Once you update your card, everything comes back online.
    </p>
  `, p, { ctaText: "Complete payment before suspension", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// INSUFFICIENT FUNDS TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const INSUFFICIENT_FUNDS_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      We tried to charge <strong>${formatCurrency(p.amount, p.currency)}</strong>, but your bank reported <strong>insufficient funds</strong>.
      We know this is usually temporary.
    </p>
    <p style="margin:0 0 12px;">You have two quick options:</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Use a different card (resolves instantly)</li>
      <li>Wait — we'll retry automatically</li>
    </ul>
  `, p, { ctaText: "Fix this now" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      We still haven't been able to complete the charge of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      If your balance is ready, a quick payment method update usually gets things moving right away.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirm payment method" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      It's been 3 days and the charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> keeps failing due to insufficient funds.
    </p>
    <p style="margin:0 0 12px;">
      The fastest option is to switch to a different card or payment method.
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Takes 1 minute to switch</li>
      <li>Your plan stays the same</li>
      <li>Avoids any interruptions</li>
    </ul>
  `, p, { ctaText: "Keep my subscription active" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your subscription is at risk. The charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> still can't be processed.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Update your payment method today</strong> to avoid the service being suspended.
    </p>
  `, p, { ctaText: "Keep my subscription active", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      <strong>Final notice:</strong> if the payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> isn't completed,
      we're suspending your subscription tomorrow.
    </p>
    <p style="margin:0 0 12px;">
      You won't lose your settings. Once you update your payment method, everything comes back.
    </p>
  `, p, { ctaText: "Complete payment before suspension", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// DO NOT HONOR TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const DO_NOT_HONOR_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your bank <strong>declined the charge</strong> of <strong>${formatCurrency(p.amount, p.currency)}</strong> without a specific reason.
      This sometimes happens due to the bank's security controls.
    </p>
    <p style="margin:0 0 12px;">You can resolve it quickly in two ways:</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Try a different card (the fastest option)</li>
      <li>Contact your bank to unblock the charge</li>
    </ul>
  `, p, { ctaText: "Fix this now" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Were you able to resolve the bank decline? The charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> is still pending.
    </p>
    <p style="margin:0 0 12px;">
      Sometimes calling your bank or using a different card is all it takes.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirm payment method" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      It's been 3 days and your bank is still declining the charge of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Using a different card is the fastest way to get this unblocked.
    </p>
  `, p, { ctaText: "Keep my subscription active" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your access may be suspended soon. The charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> has been declined by your bank multiple times.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Update your card today</strong> and everything continues as normal.
    </p>
  `, p, { ctaText: "Keep my subscription active", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      <strong>Final notice:</strong> your bank keeps declining the charge of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
      We're suspending your subscription tomorrow.
    </p>
    <p style="margin:0 0 12px;">
      Switch cards now to avoid the interruption. Your settings and data will remain intact.
    </p>
  `, p, { ctaText: "Complete payment before suspension", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// AUTHENTICATION REQUIRED (3D Secure) TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const AUTHENTICATION_REQUIRED_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your bank requires an <strong>additional confirmation</strong> (3D Secure) to process the charge of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      This is a normal security step. You can resolve it in two ways:
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Authorize the charge through your bank's app</li>
      <li>Or use a different card that doesn't require verification</li>
    </ul>
  `, p, { ctaText: "Fix this now" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> still needs confirmation. Your bank requires 3D Secure verification.
    </p>
    <p style="margin:0 0 12px;">
      If you'd rather skip this step, you can use a different card.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirm payment method" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      It's been 3 days waiting for your payment confirmation of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      You can authorize it through your banking app or switch to a different card.
    </p>
  `, p, { ctaText: "Keep my subscription active" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your subscription will be suspended soon if you don't confirm the payment of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Complete the authentication or switch cards</strong> to keep your access.
    </p>
  `, p, { ctaText: "Keep my subscription active", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      <strong>Final notice:</strong> complete the payment verification of <strong>${formatCurrency(p.amount, p.currency)}</strong>
      or update your card. We're suspending the service tomorrow.
    </p>
    <p style="margin:0 0 12px;">
      Your settings and data are saved. Once you resolve this, everything comes back online.
    </p>
  `, p, { ctaText: "Complete payment before suspension", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// INCORRECT DATA TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const INCORRECT_DATA_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      We couldn't process your payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> because your card details have an <strong>error</strong>
      (card number, CVC, or expiration date).
    </p>
    <p style="margin:0 0 12px;">
      Update the correct details and it processes instantly.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Fix card details" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      We're still seeing incorrect details on your card. The charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> can't be processed.
    </p>
    <p style="margin:0 0 12px;">
      Double-check the card number, CVC, and expiration date, or try a different card.
    </p>
  `, p, { ctaText: "Update card details" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      It's been 3 days and the charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> keeps failing due to incorrect card details.
    </p>
    <p style="margin:0 0 12px;">
      Update your details or use a different card to keep your service active.
    </p>
  `, p, { ctaText: "Keep my subscription active" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your subscription is pausing soon if you don't fix your card details.
      The charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> is still pending.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Update your card today</strong> and everything continues as normal.
    </p>
  `, p, { ctaText: "Keep my subscription active", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      <strong>Final notice:</strong> fix your card details or use a different card to complete the payment of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
      We're suspending the service tomorrow.
    </p>
    <p style="margin:0 0 12px;">
      Your settings and data are saved.
    </p>
  `, p, { ctaText: "Complete payment before suspension", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// GENERIC TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const GENERIC_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> couldn't be completed.
      Sometimes banks decline a charge for security reasons or due to outdated details.
    </p>
    <p style="margin:0 0 12px;">The fastest way to fix it:</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Confirm or update your payment method</li>
      <li>Or use a different card</li>
    </ul>
    ${anxietyBlock()}
  `, p, { ctaText: "Fix this now" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      We're still seeing the pending payment of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      One click and you're done. Your plan and data stay exactly the same.
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Just one step</li>
      <li>Your plan doesn't change</li>
      <li>No interruptions</li>
    </ul>
  `, p, { ctaText: "Confirm payment method" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      It's been 3 days without a successful charge of <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Whenever you're ready, updating your payment method will process it instantly.
    </p>
  `, p, { ctaText: "Keep my subscription active" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      Your access may be suspended soon. The charge of <strong>${formatCurrency(p.amount, p.currency)}</strong> still hasn't gone through.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Update your payment method today</strong> to keep your service active.
    </p>
  `, p, { ctaText: "Keep my subscription active", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 12px;">
      <strong>Final notice:</strong> if the payment of <strong>${formatCurrency(p.amount, p.currency)}</strong> isn't completed,
      we're suspending your subscription tomorrow.
    </p>
    <p style="margin:0 0 12px;">
      You won't lose your settings or data. Once you update your payment method, everything comes back online.
    </p>
  `, p, { ctaText: "Complete payment before suspension", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// TEMPLATE REGISTRY
// ════════════════════════════════════════════════════

const TEMPLATES: Record<EmailType, Record<SequenceStep, (p: TemplateParams) => string>> = {
  expired_card: EXPIRED_CARD_TEMPLATES,
  insufficient_funds: INSUFFICIENT_FUNDS_TEMPLATES,
  do_not_honor: DO_NOT_HONOR_TEMPLATES,
  authentication_required: AUTHENTICATION_REQUIRED_TEMPLATES,
  incorrect_data: INCORRECT_DATA_TEMPLATES,
  generic: GENERIC_TEMPLATES,
};

export function getEmailHtml(
  emailType: EmailType,
  step: SequenceStep,
  params: TemplateParams
): string {
  return TEMPLATES[emailType][step](params);
}

import { BILLING_PLAN_AMOUNT_USD } from "@/lib/billing/config";
import { getResend, isEmailConfigured } from "@/lib/email/resend";

interface TrialEndedEmailParams {
  to: string;
  companyName?: string;
  recoveredAmount: number;
  paymentUrl: string;
  reachedMinimumCharge: boolean;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function sendTrialEndedBillingEmail(
  params: TrialEndedEmailParams
): Promise<boolean> {
  const brand = params.companyName?.trim() || "RecurBoost";
  const recovered = formatUsd(params.recoveredAmount);
  const planPrice = formatUsd(BILLING_PLAN_AMOUNT_USD);

  const subject = params.reachedMinimumCharge
    ? `Tu prueba terminó: recuperaste ${recovered}`
    : `Tu prueba terminó: recuperaste ${recovered} (sin cobro)`;

  const ctaHtml = params.reachedMinimumCharge
    ? `<a href="${params.paymentUrl}" style="display:inline-block;margin-top:18px;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
        Activar plan ${planPrice}/mes
      </a>`
    : `<p style="margin-top:14px;color:#374151;">
        Este mes recuperaste menos de ${planPrice}, por eso no te cobramos.
      </p>
      <a href="${params.paymentUrl}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#f4f4f5;color:#111827;text-decoration:none;border-radius:8px;font-weight:600;">
        Ver resumen y plan
      </a>`;

  const html = `<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;">
      <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">Tu prueba de 30 días terminó</h1>
      <p style="margin:0 0 8px;color:#374151;">Hola,</p>
      <p style="margin:0 0 8px;color:#374151;">
        En estos 30 días, ${brand} recuperó <strong>${recovered}</strong> en pagos fallidos.
      </p>
      <p style="margin:0 0 8px;color:#374151;">
        El plan es <strong>${planPrice}/mes</strong>.
      </p>
      ${ctaHtml}
      <p style="margin-top:16px;color:#71717a;font-size:12px;">
        Si ya activaste el plan, podés ignorar este email.
      </p>
    </div>
  </body>
</html>`;

  if (!isEmailConfigured()) {
    console.log("[DEV] Billing email would be sent:");
    console.log(`  To: ${params.to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Recovered: ${recovered}`);
    return true;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
  const fromName = "RecurBoost";

  await getResend().emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: params.to,
    subject,
    html,
  });

  return true;
}

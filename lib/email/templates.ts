import type { EmailType, SequenceStep } from "@/lib/types";

interface TemplateParams {
  companyName: string;
  companyLogo?: string;
  senderName: string;
  portalUrl: string;
  amount: string;
  currency: string;
}

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(num);
}

function wrapHtml(body: string, params: TemplateParams): string {
  const logoHtml = params.companyLogo
    ? `<img src="${params.companyLogo}" alt="${params.companyName}" style="max-height:48px;margin-bottom:16px;" />`
    : `<h2 style="margin:0 0 16px;color:#111;">${params.companyName}</h2>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
    ${logoHtml}
    ${body}
    <div style="margin-top:24px;">
      <a href="${params.portalUrl}" style="display:inline-block;padding:12px 24px;background:#635bff;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
        Actualizar método de pago
      </a>
    </div>
    <p style="margin-top:32px;font-size:12px;color:#9ca3af;">
      Este email fue enviado por ${params.companyName}. Si tenés alguna pregunta, respondé a este email.
    </p>
  </div>
</body>
</html>`;
}

type TemplateGenerator = Record<SequenceStep, (params: TemplateParams) => string>;

const EXPIRED_CARD_TEMPLATES: TemplateGenerator = {
  0: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Notamos que tu tarjeta ha expirado y no pudimos procesar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.</p>
    <p style="color:#374151;">Para mantener tu suscripción activa, por favor actualizá tu método de pago haciendo clic en el botón de abajo.</p>
  `, p),
  1: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Te recordamos que tu tarjeta expiró y tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> aún está pendiente.</p>
    <p style="color:#374151;">Actualizá tu tarjeta para evitar la interrupción de tu servicio.</p>
  `, p),
  2: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Este es nuestro último recordatorio. Tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> no se pudo procesar porque tu tarjeta expiró.</p>
    <p style="color:#374151;">Si no actualizás tu método de pago pronto, tu suscripción podría ser cancelada.</p>
  `, p),
};

const INSUFFICIENT_FUNDS_TEMPLATES: TemplateGenerator = {
  0: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Tu pago reciente de <strong>${formatCurrency(p.amount, p.currency)}</strong> no se pudo procesar. Esto suele ser un problema temporal.</p>
    <p style="color:#374151;">Si todo está en orden con tu cuenta, podés actualizar tu método de pago o simplemente esperar a que lo reintentemos.</p>
  `, p),
  1: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Aún no pudimos cobrar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.</p>
    <p style="color:#374151;">Podés actualizar tu método de pago para resolver esto rápidamente.</p>
  `, p),
  2: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Llevamos varios días intentando procesar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> sin éxito.</p>
    <p style="color:#374151;">Por favor, actualizá tu método de pago para mantener tu suscripción activa.</p>
  `, p),
};

const GENERIC_TEMPLATES: TemplateGenerator = {
  0: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Hubo un problema al procesar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.</p>
    <p style="color:#374151;">Por favor, revisá tu método de pago y actualizalo si es necesario.</p>
  `, p),
  1: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue pendiente.</p>
    <p style="color:#374151;">Actualizá tu método de pago para mantener tu servicio sin interrupciones.</p>
  `, p),
  2: (p) => wrapHtml(`
    <p style="color:#374151;">Hola,</p>
    <p style="color:#374151;">Este es nuestro último intento de contactarte sobre tu pago pendiente de <strong>${formatCurrency(p.amount, p.currency)}</strong>.</p>
    <p style="color:#374151;">Actualizá tu método de pago lo antes posible para evitar la cancelación de tu suscripción.</p>
  `, p),
};

const TEMPLATES: Record<EmailType, TemplateGenerator> = {
  expired_card: EXPIRED_CARD_TEMPLATES,
  insufficient_funds: INSUFFICIENT_FUNDS_TEMPLATES,
  generic: GENERIC_TEMPLATES,
};

export function getEmailHtml(
  emailType: EmailType,
  step: SequenceStep,
  params: TemplateParams
): string {
  return TEMPLATES[emailType][step](params);
}

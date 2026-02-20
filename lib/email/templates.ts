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
  const ctaText = options.ctaText || "Actualizar método de pago";

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
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#92400e;">💡 Oferta especial</p>
        <p style="margin:0;font-size:13px;color:#78350f;">${params.incentiveText}</p>
      </div>`
    : "";

  const exitOptionHtml = options.showExitOption
    ? `<p style="margin-top:16px;font-size:12px;color:#9ca3af;text-align:center;">
        Si ya no necesitás el servicio, podés ignorar este email.
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
        Este enlace es seguro y funciona solo para tu cuenta.
      </p>
      <div style="margin-top:6px;font-size:11px;color:#d1d5db;">
        Si el botón no funciona, copiá y pegá este link: <br/>
        <span style="word-break:break-all;color:#9ca3af;">${params.portalUrl}</span>
      </div>
    </div>

    <div style="margin-top:18px;padding:14px;border:1px solid #eef0f6;border-radius:10px;background:#fafbff;">
      <div style="font-size:13px;color:#374151;">
        ¿Te trabaste o preferís que lo resolvamos juntos? Respondé a este email y te ayudamos.
      </div>
    </div>

    ${exitOptionHtml}

    <p style="margin-top:22px;font-size:12px;color:#9ca3af;">
      Este email fue enviado por ${params.companyName}. Si ya actualizaste tu método de pago, podés ignorarlo.
    </p>
  </div>
  ${openPixelHtml}
</body>
</html>`;
}

// ─── Helper: anxiety reduction block ───
function anxietyBlock(): string {
  return `<ul style="margin:0 0 12px;padding-left:18px;font-size:14px;line-height:1.8;color:#374151;">
      <li>Se hace en menos de 1 minuto</li>
      <li>No cambia tu plan</li>
      <li>No perdés configuración ni datos</li>
      <li>No hay cargos adicionales</li>
    </ul>`;
}

// ════════════════════════════════════════════════════
// EXPIRED CARD TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const EXPIRED_CARD_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      No pudimos procesar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> porque tu tarjeta <strong>expiró</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Tu suscripción sigue activa. Solo necesitás actualizar tu método de pago para que todo siga funcionando.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Resolver ahora" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Recordatorio rápido: seguimos sin poder cobrar <strong>${formatCurrency(p.amount, p.currency)}</strong> porque tu tarjeta está expirada.
    </p>
    <p style="margin:0 0 12px;">
      Un solo paso y queda resuelto. Es el mismo proceso seguro de siempre.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirmar método de pago" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Ya pasaron 3 días y todavía no pudimos cobrar <strong>${formatCurrency(p.amount, p.currency)}</strong>.
      Tu tarjeta sigue figurando como expirada.
    </p>
    <p style="margin:0 0 12px;">
      Actualizá el método de pago para evitar interrupciones en tu servicio.
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Un solo paso</li>
      <li>Sin llamadas ni formularios raros</li>
      <li>Tu suscripción sigue igual</li>
    </ul>
  `, p, { ctaText: "Mantener mi suscripción activa" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue pendiente por tarjeta expirada.
      <strong>Tu acceso se puede pausar pronto</strong> si no se resuelve.
    </p>
    <p style="margin:0 0 12px;">
      Todavía estás a tiempo. Actualizá tu tarjeta y sigue todo igual.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      <strong>Último aviso:</strong> mañana pausamos tu suscripción si no se completa el pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      No perdés tu configuración ni datos. Cuando actualices la tarjeta, todo vuelve a funcionar.
    </p>
  `, p, { ctaText: "Completar pago antes de la pausa", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// INSUFFICIENT FUNDS TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const INSUFFICIENT_FUNDS_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Intentamos cobrar <strong>${formatCurrency(p.amount, p.currency)}</strong>, pero tu banco indicó <strong>fondos insuficientes</strong>.
      Sabemos que esto suele ser algo temporal.
    </p>
    <p style="margin:0 0 12px;">Tenés dos opciones rápidas:</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Usar otra tarjeta (se resuelve al instante)</li>
      <li>Esperar: vamos a reintentar automáticamente</li>
    </ul>
  `, p, { ctaText: "Resolver ahora" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Seguimos sin poder completar el cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Si tu saldo ya está ok, una actualización rápida del método de pago suele destrabarlo.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirmar método de pago" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Ya pasaron 3 días y el cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue fallando por fondos insuficientes.
    </p>
    <p style="margin:0 0 12px;">
      La opción más rápida es cambiar a otra tarjeta o método de pago.
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Se cambia en 1 minuto</li>
      <li>No cambia tu plan</li>
      <li>Evita interrupciones</li>
    </ul>
  `, p, { ctaText: "Mantener mi suscripción activa" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu suscripción está en riesgo. El cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue sin poder procesarse.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Actualizá tu método de pago hoy</strong> para evitar la pausa del servicio.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      <strong>Último aviso:</strong> si no se completa el pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>,
      pausamos tu suscripción mañana.
    </p>
    <p style="margin:0 0 12px;">
      No perdés tu configuración. Cuando actualices el método de pago, todo vuelve.
    </p>
  `, p, { ctaText: "Completar pago antes de la pausa", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// DO NOT HONOR TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const DO_NOT_HONOR_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu banco <strong>rechazó el cobro</strong> de <strong>${formatCurrency(p.amount, p.currency)}</strong> sin un motivo específico.
      Esto pasa a veces por controles de seguridad del banco.
    </p>
    <p style="margin:0 0 12px;">Podés resolverlo rápido de dos formas:</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Probá con otra tarjeta (la opción más rápida)</li>
      <li>Contactá a tu banco para desbloquear el cobro</li>
    </ul>
  `, p, { ctaText: "Resolver ahora" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      ¿Pudiste resolver el rechazo del banco? El cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue pendiente.
    </p>
    <p style="margin:0 0 12px;">
      A veces alcanza con llamar al banco o usar otra tarjeta.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirmar método de pago" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Ya pasaron 3 días y tu banco sigue rechazando el cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Usar otra tarjeta es la forma más rápida de destrabar esto.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu acceso puede pausarse pronto. El cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> fue rechazado por el banco múltiples veces.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Actualizá tu tarjeta hoy</strong> y sigue todo igual.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      <strong>Último aviso:</strong> el banco sigue rechazando el cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
      Mañana pausamos tu suscripción.
    </p>
    <p style="margin:0 0 12px;">
      Cambiá de tarjeta ahora y evitá la interrupción. Tu configuración y datos quedan intactos.
    </p>
  `, p, { ctaText: "Completar pago antes de la pausa", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// AUTHENTICATION REQUIRED (3D Secure) TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const AUTHENTICATION_REQUIRED_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu banco necesita una <strong>confirmación adicional</strong> (3D Secure) para procesar el cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Esto es un paso de seguridad normal. Podés resolverlo de dos formas:
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Autorizá el cobro desde la app de tu banco</li>
      <li>O usá otra tarjeta que no requiera verificación</li>
    </ul>
  `, p, { ctaText: "Resolver ahora" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Falta confirmar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>. Tu banco requiere verificación 3D Secure.
    </p>
    <p style="margin:0 0 12px;">
      Si preferís evitar este paso, podés usar otra tarjeta.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Confirmar método de pago" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Ya pasaron 3 días esperando la confirmación de tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Podés autorizarlo desde tu app bancaria o cambiar a otra tarjeta.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu suscripción se pausa pronto si no confirmás el pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Confirmá la autenticación o cambiá de tarjeta</strong> para mantener tu acceso.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      <strong>Último aviso:</strong> completá la verificación del pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>
      o actualizá tu tarjeta. Mañana pausamos el servicio.
    </p>
    <p style="margin:0 0 12px;">
      Tu configuración y datos quedan guardados. Cuando lo resuelvas, todo vuelve a funcionar.
    </p>
  `, p, { ctaText: "Completar pago antes de la pausa", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// INCORRECT DATA TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const INCORRECT_DATA_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      No pudimos procesar tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> porque los datos de tu tarjeta tienen un <strong>error</strong>
      (número, CVC o fecha de vencimiento).
    </p>
    <p style="margin:0 0 12px;">
      Actualizá los datos correctos y se procesa al instante.
    </p>
    ${anxietyBlock()}
  `, p, { ctaText: "Corregir datos de tarjeta" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Seguimos viendo datos incorrectos en tu tarjeta. El cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> no se puede procesar.
    </p>
    <p style="margin:0 0 12px;">
      Verificá el número, CVC y fecha de vencimiento, o probá con otra tarjeta.
    </p>
  `, p, { ctaText: "Actualizar datos de tarjeta" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Ya pasaron 3 días y el cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue fallando por datos incorrectos.
    </p>
    <p style="margin:0 0 12px;">
      Actualizá los datos o usá otra tarjeta para mantener tu servicio activo.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu suscripción se pausa pronto si no corregís los datos de tu tarjeta.
      El cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue pendiente.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Actualizá tu tarjeta hoy</strong> y sigue todo igual.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      <strong>Último aviso:</strong> corregí los datos de tu tarjeta o usá otra para completar el pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
      Mañana pausamos el servicio.
    </p>
    <p style="margin:0 0 12px;">
      Tu configuración y datos quedan guardados.
    </p>
  `, p, { ctaText: "Completar pago antes de la pausa", showExitOption: true }),
};

// ════════════════════════════════════════════════════
// GENERIC TEMPLATES (5 steps)
// ════════════════════════════════════════════════════

const GENERIC_TEMPLATES: Record<SequenceStep, (p: TemplateParams) => string> = {
  0: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu pago de <strong>${formatCurrency(p.amount, p.currency)}</strong> no pudo completarse.
      A veces el banco rechaza el intento por seguridad o por datos desactualizados.
    </p>
    <p style="margin:0 0 12px;">La forma más rápida de resolverlo es:</p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Confirmar/actualizar el método de pago</li>
      <li>O usar otra tarjeta</li>
    </ul>
    ${anxietyBlock()}
  `, p, { ctaText: "Resolver ahora" }),

  1: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Seguimos viendo el pago pendiente de <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Un click y queda resuelto. No cambia tu plan ni tus datos.
    </p>
    <ul style="margin:0 0 12px;padding-left:18px;">
      <li>Un solo paso</li>
      <li>Sin cambiar tu plan</li>
      <li>Evita interrupciones</li>
    </ul>
  `, p, { ctaText: "Confirmar método de pago" }),

  2: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Ya pasaron 3 días sin poder cobrar <strong>${formatCurrency(p.amount, p.currency)}</strong>.
    </p>
    <p style="margin:0 0 12px;">
      Si te queda más cómodo, podés actualizar el método de pago y se procesa al instante.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa" }),

  3: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      Tu acceso puede pausarse pronto. El cobro de <strong>${formatCurrency(p.amount, p.currency)}</strong> sigue sin completarse.
    </p>
    <p style="margin:0 0 12px;">
      <strong>Actualizá tu método de pago hoy</strong> para mantener tu servicio activo.
    </p>
  `, p, { ctaText: "Mantener mi suscripción activa", showExitOption: true }),

  4: (p) => wrapHtml(`
    <p style="margin:0 0 12px;">Hola,</p>
    <p style="margin:0 0 12px;">
      <strong>Último aviso:</strong> si no se completa el pago de <strong>${formatCurrency(p.amount, p.currency)}</strong>,
      pausamos tu suscripción mañana.
    </p>
    <p style="margin:0 0 12px;">
      No perdés tu configuración ni datos. Cuando actualices el método de pago, todo vuelve a funcionar.
    </p>
  `, p, { ctaText: "Completar pago antes de la pausa", showExitOption: true }),
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

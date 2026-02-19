import type { EmailSequenceConfig, FailureType, EmailType } from "@/lib/types";

const FAILURE_TO_EMAIL_TYPE: Record<FailureType, EmailType | null> = {
  EXPIRED_CARD: "expired_card",
  INSUFFICIENT_FUNDS: "insufficient_funds",
  GENERIC: "generic",
  HARD_DECLINE: null, // No email sequence for hard declines
};

export function getEmailTypeForFailure(failureType: FailureType): EmailType | null {
  return FAILURE_TO_EMAIL_TYPE[failureType];
}

export const EMAIL_SEQUENCES: Record<EmailType, EmailSequenceConfig> = {
  expired_card: {
    type: "expired_card",
    steps: [
      { day: 0, step: 0, subject: "Tu tarjeta ha expirado — actualizá tu método de pago" },
      { day: 2, step: 1, subject: "Recordatorio: tu suscripción necesita una tarjeta actualizada" },
      { day: 5, step: 2, subject: "Último aviso: actualizá tu tarjeta para mantener tu suscripción" },
    ],
  },
  insufficient_funds: {
    type: "insufficient_funds",
    steps: [
      { day: 0, step: 0, subject: "Hubo un problema con tu pago" },
      { day: 2, step: 1, subject: "Tu pago aún no se pudo procesar" },
      { day: 5, step: 2, subject: "Acción requerida: actualizá tu método de pago" },
    ],
  },
  generic: {
    type: "generic",
    steps: [
      { day: 0, step: 0, subject: "Hubo un problema con tu pago reciente" },
      { day: 2, step: 1, subject: "Tu pago necesita atención" },
      { day: 5, step: 2, subject: "Último recordatorio sobre tu pago pendiente" },
    ],
  },
};

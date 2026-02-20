import type { EmailSequenceConfig, FailureType, EmailType } from "@/lib/types";

const FAILURE_TO_EMAIL_TYPE: Record<FailureType, EmailType | null> = {
  EXPIRED_CARD: "expired_card",
  INSUFFICIENT_FUNDS: "insufficient_funds",
  DO_NOT_HONOR: "do_not_honor",
  AUTHENTICATION_REQUIRED: "authentication_required",
  INCORRECT_DATA: "incorrect_data",
  GENERIC: "generic",
  // Hard declines: no email
  HARD_DECLINE_STOLEN: null,
  HARD_DECLINE_FRAUD: null,
  HARD_DECLINE_BLOCKED: null,
  HARD_DECLINE: null, // legacy backward compat
};

export function getEmailTypeForFailure(failureType: FailureType): EmailType | null {
  return FAILURE_TO_EMAIL_TYPE[failureType];
}

export const EMAIL_SEQUENCES: Record<EmailType, EmailSequenceConfig> = {
  // ─── EXPIRED CARD ───
  expired_card: {
    type: "expired_card",
    steps: [
      {
        day: 0, step: 0,
        subject: "Tu suscripción sigue activa, pero la tarjeta expiró",
        preheader: "Actualizala en 1 minuto. No cambia tu plan ni tus datos.",
      },
      {
        day: 1, step: 1,
        subject: "Un minuto y queda resuelto — tarjeta expirada",
        preheader: "Seguimos viendo la tarjeta expirada. Un paso y queda.",
      },
      {
        day: 3, step: 2,
        subject: "Ya pasaron 3 días — ¿actualizamos tu tarjeta?",
        preheader: "Tu suscripción sigue activa pero el cobro está pendiente.",
      },
      {
        day: 5, step: 3,
        subject: "Tu acceso se pausa pronto si no actualizás",
        preheader: "Todavía estás a tiempo. Un click y sigue todo igual.",
      },
      {
        day: 7, step: 4,
        subject: "Último aviso antes de pausar tu suscripción",
        preheader: "Mañana pausamos el servicio. Actualizá ahora para evitarlo.",
        isFinalWarning: true,
      },
    ],
  },

  // ─── INSUFFICIENT FUNDS ───
  insufficient_funds: {
    type: "insufficient_funds",
    steps: [
      {
        day: 0, step: 0,
        subject: "Pago pendiente — podés resolverlo ahora o esperar el reintento",
        preheader: "Vamos a reintentar, pero podés acelerarlo con un click.",
      },
      {
        day: 1, step: 1,
        subject: "¿Actualizaste el método de pago? Solo toma 1 minuto",
        preheader: "Si tu saldo ya está ok, actualizá y se procesa al instante.",
      },
      {
        day: 3, step: 2,
        subject: "Seguimos intentando cobrar. Tenés una opción más rápida",
        preheader: "Cambiá de tarjeta o esperá el próximo intento automático.",
      },
      {
        day: 5, step: 3,
        subject: "Tu suscripción está en riesgo — resolvelo hoy",
        preheader: "El cobro sigue fallando. Actualizá para evitar la pausa.",
      },
      {
        day: 7, step: 4,
        subject: "Mañana pausamos el servicio si no se completa el pago",
        preheader: "Último aviso. Actualizá tu método de pago para continuar.",
        isFinalWarning: true,
      },
    ],
  },

  // ─── DO NOT HONOR ───
  do_not_honor: {
    type: "do_not_honor",
    steps: [
      {
        day: 0, step: 0,
        subject: "Tu banco rechazó el pago — probá con otra tarjeta",
        preheader: "El banco no autorizó el cobro. Usar otra tarjeta lo resuelve.",
      },
      {
        day: 1, step: 1,
        subject: "¿Pudiste resolver el rechazo del banco?",
        preheader: "A veces alcanza con llamar al banco o usar otra tarjeta.",
      },
      {
        day: 3, step: 2,
        subject: "Tu pago sigue rechazado por el banco — opciones rápidas",
        preheader: "Probá con otra tarjeta o contactá a tu banco para desbloquearlo.",
      },
      {
        day: 5, step: 3,
        subject: "Tu acceso puede pausarse — el banco sigue rechazando",
        preheader: "Usar otra tarjeta es la forma más rápida de resolverlo.",
      },
      {
        day: 7, step: 4,
        subject: "Último aviso: actualizá tu tarjeta para mantener el servicio",
        preheader: "Mañana pausamos el acceso. Actualizá ahora.",
        isFinalWarning: true,
      },
    ],
  },

  // ─── AUTHENTICATION REQUIRED (3D Secure) ───
  authentication_required: {
    type: "authentication_required",
    steps: [
      {
        day: 0, step: 0,
        subject: "Tu banco necesita una confirmación rápida (3D Secure)",
        preheader: "El cobro requiere autenticación. Confirmalo en 1 minuto.",
      },
      {
        day: 1, step: 1,
        subject: "Falta confirmar tu pago — tu banco requiere verificación",
        preheader: "Solo necesitás autorizar el cobro desde tu banco o app.",
      },
      {
        day: 3, step: 2,
        subject: "3 días esperando tu confirmación de pago",
        preheader: "Autorizá el cobro o usá otra tarjeta sin 3D Secure.",
      },
      {
        day: 5, step: 3,
        subject: "Tu suscripción se pausa si no confirmás el pago",
        preheader: "Confirmá la autenticación o cambiá de tarjeta.",
      },
      {
        day: 7, step: 4,
        subject: "Último aviso: completá la verificación o actualizá tu tarjeta",
        preheader: "Mañana pausamos el servicio. Resolvelo ahora.",
        isFinalWarning: true,
      },
    ],
  },

  // ─── INCORRECT DATA ───
  incorrect_data: {
    type: "incorrect_data",
    steps: [
      {
        day: 0, step: 0,
        subject: "Los datos de tu tarjeta tienen un error — actualizalos",
        preheader: "Número, CVC o vencimiento incorrectos. Corregilo en 1 minuto.",
      },
      {
        day: 1, step: 1,
        subject: "Seguimos viendo datos incorrectos en tu tarjeta",
        preheader: "Verificá el número, CVC y fecha de vencimiento.",
      },
      {
        day: 3, step: 2,
        subject: "Tu pago sigue fallando por datos de tarjeta incorrectos",
        preheader: "Actualizá los datos o probá con otra tarjeta.",
      },
      {
        day: 5, step: 3,
        subject: "Tu suscripción se pausa pronto — corregí los datos",
        preheader: "Actualizá tu tarjeta para que podamos cobrar.",
      },
      {
        day: 7, step: 4,
        subject: "Último aviso: corregí tu tarjeta para mantener el servicio",
        preheader: "Mañana pausamos el acceso. Actualizá ahora.",
        isFinalWarning: true,
      },
    ],
  },

  // ─── GENERIC ───
  generic: {
    type: "generic",
    steps: [
      {
        day: 0, step: 0,
        subject: "Tu suscripción sigue activa — resolvé el pago en 1 minuto",
        preheader: "Hubo un problema con el cobro. Actualizá tu método de pago.",
      },
      {
        day: 1, step: 1,
        subject: "Pago pendiente — todavía podés resolverlo fácil",
        preheader: "Un click y queda. No cambia tu plan.",
      },
      {
        day: 3, step: 2,
        subject: "3 días sin poder cobrar — ¿todo bien?",
        preheader: "Actualizá tu método de pago para evitar interrupciones.",
      },
      {
        day: 5, step: 3,
        subject: "Tu acceso puede pausarse pronto",
        preheader: "Todavía estás a tiempo de resolver el pago.",
      },
      {
        day: 7, step: 4,
        subject: "Último aviso: completá el pago o pausamos el servicio",
        preheader: "Mañana se pausa tu suscripción. Actualizá ahora.",
        isFinalWarning: true,
      },
    ],
  },
};

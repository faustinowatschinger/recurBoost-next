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
        subject: "Your subscription is active, but your card has expired",
        preheader: "Update it in 1 minute. Your plan and data stay the same.",
      },
      {
        day: 1, step: 1,
        subject: "One minute to fix this — expired card",
        preheader: "Your card is still showing as expired. One step and you're done.",
      },
      {
        day: 3, step: 2,
        subject: "3 days have passed — ready to update your card?",
        preheader: "Your subscription is still active but payment is pending.",
      },
      {
        day: 5, step: 3,
        subject: "Your access will be suspended soon if you don't update",
        preheader: "You still have time. One click and everything stays the same.",
      },
      {
        day: 7, step: 4,
        subject: "Final notice before suspending your subscription",
        preheader: "We're suspending the service tomorrow. Update now to prevent it.",
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
        subject: "Payment pending — you can fix it now or wait for the retry",
        preheader: "We'll retry automatically, but you can speed it up with one click.",
      },
      {
        day: 1, step: 1,
        subject: "Have you updated your payment method? It only takes 1 minute",
        preheader: "If your balance is ready, update now and it processes instantly.",
      },
      {
        day: 3, step: 2,
        subject: "We're still retrying. There's a faster option available",
        preheader: "Switch cards or wait for the next automatic retry.",
      },
      {
        day: 5, step: 3,
        subject: "Your subscription is at risk — fix this today",
        preheader: "Payment keeps failing. Update now to avoid suspension.",
      },
      {
        day: 7, step: 4,
        subject: "We're suspending the service tomorrow if payment isn't completed",
        preheader: "Final notice. Update your payment method to keep going.",
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
        subject: "Your bank declined the charge — try a different card",
        preheader: "Your bank didn't authorize the payment. Using another card fixes it.",
      },
      {
        day: 1, step: 1,
        subject: "Were you able to resolve the bank decline?",
        preheader: "Sometimes calling your bank or using a different card is all it takes.",
      },
      {
        day: 3, step: 2,
        subject: "Your bank is still declining the charge — quick options",
        preheader: "Try another card or contact your bank to unblock it.",
      },
      {
        day: 5, step: 3,
        subject: "Your access may be suspended — bank keeps declining",
        preheader: "Using a different card is the fastest way to resolve this.",
      },
      {
        day: 7, step: 4,
        subject: "Final notice: update your card to keep the service",
        preheader: "We're suspending access tomorrow. Update now.",
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
        subject: "Your bank needs a quick confirmation (3D Secure)",
        preheader: "The charge requires authentication. Confirm it in 1 minute.",
      },
      {
        day: 1, step: 1,
        subject: "Your payment still needs confirmation — your bank requires verification",
        preheader: "You just need to authorize the charge from your bank or app.",
      },
      {
        day: 3, step: 2,
        subject: "3 days waiting for your payment confirmation",
        preheader: "Authorize the charge or use a card that doesn't require 3D Secure.",
      },
      {
        day: 5, step: 3,
        subject: "Your subscription will be suspended if you don't confirm payment",
        preheader: "Confirm authentication or switch cards.",
      },
      {
        day: 7, step: 4,
        subject: "Final notice: complete verification or update your card",
        preheader: "We're suspending the service tomorrow. Fix this now.",
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
        subject: "Your card details have an error — please update them",
        preheader: "Incorrect number, CVC, or expiry. Fix it in 1 minute.",
      },
      {
        day: 1, step: 1,
        subject: "We're still seeing incorrect details on your card",
        preheader: "Check the card number, CVC, and expiration date.",
      },
      {
        day: 3, step: 2,
        subject: "Your payment keeps failing due to incorrect card details",
        preheader: "Update your details or try a different card.",
      },
      {
        day: 5, step: 3,
        subject: "Your subscription is pausing soon — fix your card details",
        preheader: "Update your card so we can process the payment.",
      },
      {
        day: 7, step: 4,
        subject: "Final notice: fix your card details to keep the service",
        preheader: "We're suspending access tomorrow. Update now.",
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
        subject: "Your subscription is active — fix the payment in 1 minute",
        preheader: "There was a problem with the charge. Update your payment method.",
      },
      {
        day: 1, step: 1,
        subject: "Payment pending — you can still fix it easily",
        preheader: "One click and you're done. Your plan stays the same.",
      },
      {
        day: 3, step: 2,
        subject: "3 days without a successful charge — everything okay?",
        preheader: "Update your payment method to avoid any interruptions.",
      },
      {
        day: 5, step: 3,
        subject: "Your access may be suspended soon",
        preheader: "You still have time to resolve the payment.",
      },
      {
        day: 7, step: 4,
        subject: "Final notice: complete the payment or we'll suspend the service",
        preheader: "Your subscription is being suspended tomorrow. Update now.",
        isFinalWarning: true,
      },
    ],
  },
};

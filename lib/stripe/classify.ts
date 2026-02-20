import type { FailureType } from "@/lib/types";

/**
 * Granular mapping of Stripe decline codes to internal failure types.
 * See: https://docs.stripe.com/declines/codes
 */
const DECLINE_CODE_MAP: Record<string, FailureType> = {
  // Hard decline — stolen/lost card: no retry, no email, force update
  stolen_card: "HARD_DECLINE_STOLEN",
  lost_card: "HARD_DECLINE_STOLEN",

  // Hard decline — fraud: no retry, no email
  fraudulent: "HARD_DECLINE_FRAUD",
  pickup_card: "HARD_DECLINE_FRAUD",
  merchant_blacklist: "HARD_DECLINE_FRAUD",

  // Hard decline — permanently blocked: no retry, no email
  restricted_card: "HARD_DECLINE_BLOCKED",
  security_violation: "HARD_DECLINE_BLOCKED",
  do_not_try_again: "HARD_DECLINE_BLOCKED",
  not_permitted: "HARD_DECLINE_BLOCKED",

  // Authentication required (3D Secure) — can recover with customer action
  authentication_required: "AUTHENTICATION_REQUIRED",

  // Soft decline — bank refused without specific reason, retryable
  do_not_honor: "DO_NOT_HONOR",

  // Insufficient funds — retryable (wait for funds)
  insufficient_funds: "INSUFFICIENT_FUNDS",
  withdrawal_count_limit_exceeded: "INSUFFICIENT_FUNDS",

  // Card expired or unsupported
  expired_card: "EXPIRED_CARD",
  card_not_supported: "EXPIRED_CARD",

  // Incorrect card data — customer needs to re-enter
  incorrect_number: "INCORRECT_DATA",
  invalid_cvc: "INCORRECT_DATA",
  incorrect_cvc: "INCORRECT_DATA",
  invalid_expiry_month: "INCORRECT_DATA",
  invalid_expiry_year: "INCORRECT_DATA",
  invalid_number: "INCORRECT_DATA",
};

export function classifyFailure(declineCode?: string | null): FailureType {
  if (!declineCode) return "GENERIC";
  return DECLINE_CODE_MAP[declineCode.toLowerCase()] ?? "GENERIC";
}

/** True only for hard declines where no email should be sent and no retry attempted */
export function isHardDecline(failureType: FailureType): boolean {
  return (
    failureType === "HARD_DECLINE_STOLEN" ||
    failureType === "HARD_DECLINE_FRAUD" ||
    failureType === "HARD_DECLINE_BLOCKED" ||
    failureType === "HARD_DECLINE" // legacy backward compat
  );
}

/** True for all failure types where sending a recovery email makes sense */
export function shouldSendEmail(failureType: FailureType): boolean {
  return !isHardDecline(failureType);
}

/** True for failure types where a smart retry via Stripe API is worth attempting */
export function isRetryableFailure(failureType: FailureType): boolean {
  return failureType === "INSUFFICIENT_FUNDS" || failureType === "DO_NOT_HONOR";
}

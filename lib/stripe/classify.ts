import type { FailureType } from "@/lib/types";

const HARD_DECLINE_CODES = new Set([
  "do_not_honor",
  "lost_card",
  "stolen_card",
  "fraudulent",
  "merchant_blacklist",
  "pickup_card",
  "restricted_card",
  "security_violation",
  "do_not_try_again",
  "not_permitted",
]);

const INSUFFICIENT_FUNDS_CODES = new Set([
  "insufficient_funds",
  "withdrawal_count_limit_exceeded",
]);

const EXPIRED_CARD_CODES = new Set([
  "expired_card",
  "card_not_supported",
]);

export function classifyFailure(declineCode?: string | null): FailureType {
  if (!declineCode) return "GENERIC";

  const code = declineCode.toLowerCase();

  if (HARD_DECLINE_CODES.has(code)) return "HARD_DECLINE";
  if (INSUFFICIENT_FUNDS_CODES.has(code)) return "INSUFFICIENT_FUNDS";
  if (EXPIRED_CARD_CODES.has(code)) return "EXPIRED_CARD";

  return "GENERIC";
}

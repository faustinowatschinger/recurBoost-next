export const COOKIE_CONSENT_STORAGE_KEY = "recurboost_cookie_consent_v1";

export type CookieConsentValue = "accepted" | "rejected";

export function isCookieConsentValue(
  value: string | null
): value is CookieConsentValue {
  return value === "accepted" || value === "rejected";
}

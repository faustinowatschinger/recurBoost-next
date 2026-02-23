export const BILLING_TRIAL_DAYS = 30;
export const BILLING_PLAN_AMOUNT_USD = 49;
export const BILLING_PLAN_AMOUNT_CENTS = BILLING_PLAN_AMOUNT_USD * 100;
export const BILLING_CURRENCY = "usd";
export const BILLING_PLAN_NAME = "RecurBoost";

export function getBillingAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

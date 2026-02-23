import { getBillingAccessState, type BillingAccessState } from "@/lib/billing/service";

export async function requireBillingAccess(userId: string): Promise<BillingAccessState> {
  const state = await getBillingAccessState(userId, { autoExpireTrial: true });
  if (!state.canAccessProduct) {
    throw new Error("BILLING_ACCESS_BLOCKED");
  }
  return state;
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  BILLING_PLAN_AMOUNT_USD,
  BILLING_TRIAL_DAYS,
} from "@/lib/billing/config";
import { getBillingAccessState } from "@/lib/billing/service";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BillingActions } from "@/components/billing/BillingActions";

interface BillingPageProps {
  searchParams?:
    | Promise<{
        checkout?: string;
      }>
    | {
        checkout?: string;
      };
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const billing = await getBillingAccessState(session.user.id, {
    autoExpireTrial: true,
  });

  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const checkoutResult = resolvedSearchParams?.checkout;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNav userName={session.user.name || session.user.email || ""} />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-text-muted mt-1">
            {BILLING_TRIAL_DAYS} days free without a card, then {formatUsd(BILLING_PLAN_AMOUNT_USD)}
            /mo.
          </p>
        </div>

        {checkoutResult === "success" && (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-sm text-primary">
            Subscription activated successfully.
          </div>
        )}
        {checkoutResult === "cancel" && (
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-sm text-warning">
            Checkout canceled. You can activate it anytime.
          </div>
        )}

        <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Current status</h2>

          {billing.billingStatus === "trialing" && (
            <div className="space-y-2 text-sm">
              <p>
                Trial active. You have <strong>{billing.trialDaysLeft}</strong>{" "}
                days left.
              </p>
              <p>
                Recovered during trial:{" "}
                <strong>{formatUsd(billing.recoveredDuringTrial)}</strong>
              </p>
              <p className="text-text-muted">
                We only charge if you recovered at least{" "}
                {formatUsd(BILLING_PLAN_AMOUNT_USD)} by the end of the trial.
              </p>
            </div>
          )}

          {billing.billingStatus === "active" && (
            <div className="space-y-2 text-sm">
              <p>
                Active plan: <strong>{formatUsd(BILLING_PLAN_AMOUNT_USD)}/mo</strong>
              </p>
              <p>
                Recovered during trial:{" "}
                <strong>{formatUsd(billing.recoveredDuringTrial)}</strong>
              </p>
              <BillingActions showActivatePlan={false} showManagePlan />
            </div>
          )}

          {billing.billingStatus === "canceled" && (
            <div className="space-y-2 text-sm">
              <p>
                Account canceled after trial ended. You recovered{" "}
                <strong>{formatUsd(billing.recoveredDuringTrial)}</strong> during
                that period.
              </p>
              {billing.reachedMinimumCharge ? (
                <p>
                  You exceeded the minimum of {formatUsd(BILLING_PLAN_AMOUNT_USD)}.
                  Activate the plan to continue using the app.
                </p>
              ) : (
                <p>
                  You didn&apos;t reach the minimum of {formatUsd(BILLING_PLAN_AMOUNT_USD)}.
                  No charge applies this month.
                </p>
              )}

              <BillingActions
                showActivatePlan={billing.reachedMinimumCharge}
                showManagePlan={false}
              />
            </div>
          )}

          {billing.billingStatus === "not_started" && (
            <div className="space-y-2 text-sm">
              <p>Your trial hasn&apos;t started yet because Stripe is not connected.</p>
              <a
                href="/onboarding"
                className="inline-block px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                Connect Stripe
              </a>
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold mb-3">Plan</h2>
          <ul className="text-sm text-text-muted space-y-2">
            <li>{BILLING_TRIAL_DAYS} days free.</li>
            <li>No credit card required during trial.</li>
            <li>{formatUsd(BILLING_PLAN_AMOUNT_USD)}/mo once activated.</li>
            <li>
              We only charge if you recovered at least{" "}
              {formatUsd(BILLING_PLAN_AMOUNT_USD)} during the trial period.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

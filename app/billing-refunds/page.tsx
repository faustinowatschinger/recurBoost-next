import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

const LAST_UPDATED = "February 24, 2026";

export const metadata: Metadata = {
  title: "Billing and Refund Policy",
  description: "Billing and Refund Policy for RecurBoost subscriptions.",
  alternates: { canonical: "/billing-refunds" },
};

export default function BillingRefundsPage() {
  return (
    <LegalShell title="Billing and Refund Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Billing and Refund Policy applies to paid subscriptions to RecurBoost,
        operated by FW Labs LLC.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Subscription Billing</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Subscriptions are billed monthly, in advance, through Stripe.</li>
          <li>Charges recur automatically until canceled.</li>
          <li>
            You authorize Stripe to charge your selected payment method according to
            your subscription plan.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Trial Period</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>A free trial may be available for eligible accounts.</li>
          <li>
            If you cancel during trial and before paid activation, no paid
            subscription charge will be applied.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Cancellation</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>You may cancel at any time through the Stripe billing portal.</li>
          <li>
            Cancellation takes effect at the end of the current billing period unless
            otherwise required by law.
          </li>
          <li>You retain access until the current paid period ends.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Refund Policy</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>No refunds for partial months or unused time.</li>
          <li>No retroactive refunds after a billing cycle has started.</li>
          <li>
            Exceptions may apply only when required by mandatory consumer protection
            laws.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Failed Payments</h2>
        <p className="text-text-muted">
          If payment fails, access may be suspended until billing is resolved.
          Continued non-payment may result in account termination.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p className="text-text-muted">
          Billing questions:{" "}
          <a className="text-primary underline" href="mailto:support@recurboost.com">
            support@recurboost.com
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}

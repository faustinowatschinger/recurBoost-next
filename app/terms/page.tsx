import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

const LAST_UPDATED = "February 24, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for RecurBoost, operated by FW Labs LLC.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of
        RecurBoost (the &quot;Service&quot;), operated by FW Labs LLC, a Delaware
        limited liability company (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or
        &quot;our&quot;). By accessing or using the Service, you agree to be bound by
        these Terms.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Eligibility</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>
            You must be at least 18 years old and legally capable of entering into
            contracts.
          </li>
          <li>
            If you use the Service on behalf of an entity, you represent that you
            have authority to bind that entity.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Description of Service</h2>
        <p className="text-text-muted">
          The Service provides automated email workflows designed to assist
          businesses in recovering failed Stripe subscription payments. We do not
          process card payments directly. Payment processing is handled by Stripe.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. No Financial Guarantee</h2>
        <p className="text-text-muted">
          We do not guarantee increased revenue, specific recovery rates, or any
          financial outcome. Metrics displayed by the Service are estimates and
          informational in nature. Results depend on factors outside our control.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Account Responsibilities</h2>
        <p className="text-text-muted">You are responsible for:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Maintaining account credentials and security.</li>
          <li>Ensuring lawful use of customer data.</li>
          <li>Complying with applicable privacy and data protection laws.</li>
        </ul>
        <p className="text-text-muted">You must not:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Reverse engineer or attempt to derive source logic.</li>
          <li>Resell, sublicense, or commercially exploit the Service without permission.</li>
          <li>Use the Service for unlawful, abusive, or fraudulent purposes.</li>
          <li>Attempt unauthorized access to any system, account, or environment.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Billing and Subscription</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Subscriptions are billed monthly unless otherwise stated.</li>
          <li>A free trial may be offered.</li>
          <li>Pricing may change with prior notice.</li>
          <li>You may cancel at any time through the billing portal.</li>
          <li>Failure to pay may result in suspension or termination of access.</li>
          <li>All payment transactions are processed by Stripe.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
        <p className="text-text-muted">
          To the maximum extent permitted by law, our total liability for any claim
          shall not exceed the amounts paid by you to the Company in the three (3)
          months preceding the event giving rise to the claim.
        </p>
        <p className="text-text-muted">We are not liable for indirect or consequential losses, including:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Loss of revenue or profits.</li>
          <li>Business interruption.</li>
          <li>Loss of data.</li>
          <li>Third-party service failures (including Stripe, Resend, analytics, and hosting providers).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Indemnification</h2>
        <p className="text-text-muted">
          You agree to defend, indemnify, and hold harmless FW Labs LLC and its
          officers, members, employees, and contractors from claims, damages,
          liabilities, and expenses arising from your misuse of the Service,
          violation of law, or improper handling of personal data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Termination</h2>
        <p className="text-text-muted">
          We may suspend or terminate access for violations of these Terms, abusive
          behavior, or unauthorized access attempts. You may cancel at any time.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Governing Law and Dispute Resolution</h2>
        <p className="text-text-muted">
          These Terms are governed by the laws of the State of Delaware, United
          States, without regard to conflict of law rules.
        </p>
        <p className="text-text-muted">
          Any dispute shall be resolved by binding arbitration in Delaware, except
          where prohibited by law. You waive any right to participate in class
          actions or class-wide arbitration.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Modifications</h2>
        <p className="text-text-muted">
          We may update these Terms from time to time. Continued use of the Service
          after updates become effective constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p className="text-text-muted">
          For legal notices or questions about these Terms:{" "}
          <a className="text-primary underline" href="mailto:support@recurboost.com">
            support@recurboost.com
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}

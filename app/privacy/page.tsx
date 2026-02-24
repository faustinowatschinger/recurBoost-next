import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

const LAST_UPDATED = "February 24, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for RecurBoost, operated by FW Labs LLC.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        FW Labs LLC (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
        respects your privacy. This Privacy Policy explains how RecurBoost collects,
        uses, and protects data.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Roles</h2>
        <p className="text-text-muted">
          For account-holder data, FW Labs LLC acts as an independent data
          controller. For end-customer data processed through the Service on behalf
          of users, FW Labs LLC acts as a data processor, and each user acts as the
          data controller.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Data We Collect</h2>
        <p className="text-text-muted">From account holders:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Name and company name.</li>
          <li>Email address and authentication data.</li>
          <li>Stripe customer/subscription identifiers and subscription metadata.</li>
          <li>Usage and product interaction events.</li>
          <li>IP address and request metadata (through hosting and infrastructure logs).</li>
        </ul>
        <p className="text-text-muted">From end customers (processed for users):</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Customer email address.</li>
          <li>Invoice metadata and payment status.</li>
          <li>Recovery workflow status (email sent/open/click, case outcome).</li>
        </ul>
        <p className="text-text-muted">
          We do not store raw credit card information. Card data is handled by Stripe.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Analytics and Tracking</h2>
        <p className="text-text-muted">We use:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>PostHog for event analytics only (no session replay recording).</li>
          <li>Email open and click tracking for recovery emails.</li>
          <li>Stripe webhooks and billing events for payment status synchronization.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Legal Bases for Processing</h2>
        <p className="text-text-muted">We process personal data based on:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Performance of a contract.</li>
          <li>Legitimate interests in operating and securing the Service.</li>
          <li>Consent where required by applicable law.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Data Retention</h2>
        <p className="text-text-muted">
          We retain data while an account is active and for up to ninety (90) days
          after cancellation for compliance, fraud prevention, and system integrity,
          unless a longer retention period is required by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. International Data Transfers</h2>
        <p className="text-text-muted">
          Data may be processed in the United States or other jurisdictions where our
          subprocessors operate. By using the Service, you acknowledge and consent to
          these cross-border transfers, subject to applicable legal safeguards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Data Deletion and Rights</h2>
        <p className="text-text-muted">
          Users may request deletion of account data by contacting support.
          End-customer data is deleted after account termination, except where
          retention is legally required or needed for security and fraud prevention.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Third-Party Processors</h2>
        <p className="text-text-muted">We currently rely on these core processors:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Stripe (payment processing and subscription billing).</li>
          <li>Resend (email delivery infrastructure).</li>
          <li>PostHog (product analytics).</li>
          <li>Hostinger VPS and related hosting infrastructure providers.</li>
        </ul>
        <p className="text-text-muted">
          Each third party maintains its own terms and privacy practices.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Security</h2>
        <p className="text-text-muted">
          We implement reasonable technical and organizational safeguards to protect
          data. No method of transmission or storage is completely secure, and we
          cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Contact</h2>
        <p className="text-text-muted">
          Privacy requests and legal inquiries:{" "}
          <a className="text-primary underline" href="mailto:support@recurboost.com">
            support@recurboost.com
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}

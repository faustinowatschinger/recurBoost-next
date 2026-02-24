import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

const LAST_UPDATED = "February 24, 2026";

export const metadata: Metadata = {
  title: "Data Processing Agreement (DPA)",
  description: "Data Processing Agreement for RecurBoost customers.",
  alternates: { canonical: "/dpa" },
};

export default function DpaPage() {
  return (
    <LegalShell title="Data Processing Agreement (DPA)" lastUpdated={LAST_UPDATED}>
      <p>
        This Data Processing Agreement (&quot;DPA&quot;) forms part of the Terms of
        Service between FW Labs LLC (&quot;Processor&quot;) and the customer using
        RecurBoost (&quot;Controller&quot;) and applies where Processor processes
        personal data on behalf of Controller.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Roles and Scope</h2>
        <p className="text-text-muted">
          Controller determines the purposes and means of processing end-customer
          personal data. Processor processes personal data only on documented
          instructions from Controller and only for providing the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Subject Matter and Duration</h2>
        <p className="text-text-muted">
          Subject matter: subscription recovery workflow automation.
        </p>
        <p className="text-text-muted">
          Duration: for as long as Controller has an active account, plus limited
          post-termination retention under applicable law and security needs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Nature and Purpose of Processing</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Ingest payment status events from Stripe.</li>
          <li>Generate and send recovery emails via Resend.</li>
          <li>Track opens and clicks for campaign performance.</li>
          <li>Provide analytics and operational metrics to Controller.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Categories of Data and Data Subjects</h2>
        <p className="text-text-muted">Data subjects:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Controller account users.</li>
          <li>Controller end customers.</li>
        </ul>
        <p className="text-text-muted">Data categories:</p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Email addresses.</li>
          <li>Invoice and subscription metadata.</li>
          <li>Payment and recovery status metadata.</li>
          <li>Event analytics metadata.</li>
        </ul>
        <p className="text-text-muted">
          Processor does not store raw payment card information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Processor Obligations</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Process data only under Controller instructions.</li>
          <li>Ensure authorized personnel are bound to confidentiality.</li>
          <li>Implement reasonable technical and organizational safeguards.</li>
          <li>Notify Controller of personal data breaches without undue delay.</li>
          <li>Assist Controller with data subject requests when reasonably possible.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Controller Obligations</h2>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Obtain lawful basis for data processing and email communications.</li>
          <li>Provide legally required notices to end customers.</li>
          <li>Respond to data subject rights requests under applicable law.</li>
          <li>Use the Service in compliance with privacy and anti-spam laws.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Subprocessors</h2>
        <p className="text-text-muted">
          Controller authorizes the use of subprocessors necessary to deliver the
          Service, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-text-muted">
          <li>Stripe (billing and payment status infrastructure).</li>
          <li>Resend (transactional email delivery).</li>
          <li>PostHog (event analytics).</li>
          <li>Hostinger VPS and related hosting providers.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. International Transfers</h2>
        <p className="text-text-muted">
          Personal data may be processed in the United States and other countries
          where subprocessors operate. Controller acknowledges and authorizes these
          transfers, subject to applicable legal safeguards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Security Measures</h2>
        <p className="text-text-muted">
          Processor maintains commercially reasonable measures, including access
          control, encryption where appropriate, and monitoring/logging practices.
          No security program can guarantee absolute protection.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Deletion and Return of Data</h2>
        <p className="text-text-muted">
          Upon termination, Processor will delete or anonymize personal data within a
          reasonable period, except where retention is required by law or for
          legitimate security and compliance purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">11. Liability</h2>
        <p className="text-text-muted">
          Liability under this DPA is subject to the limitations in the Terms of
          Service, except where prohibited by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">12. Governing Law</h2>
        <p className="text-text-muted">
          This DPA is governed by the laws of the State of Delaware, United States,
          unless mandatory law requires otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">13. Contact</h2>
        <p className="text-text-muted">
          DPA and privacy requests:{" "}
          <a className="text-primary underline" href="mailto:support@recurboost.com">
            support@recurboost.com
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}

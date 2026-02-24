import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

const LAST_UPDATED = "February 24, 2026";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for RecurBoost, operated by FW Labs LLC.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Cookie Policy explains how RecurBoost uses cookies and similar
        technologies when you visit or use the Service.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Essential Cookies</h2>
        <p className="text-text-muted">
          We use essential cookies required for authentication, session continuity,
          and core security features. These cookies are necessary for the Service to
          function.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Analytics Cookies</h2>
        <p className="text-text-muted">
          We use PostHog analytics to measure product usage and service performance.
          Analytics are configured for event tracking only.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Email Tracking Pixels</h2>
        <p className="text-text-muted">
          Recovery emails may include tracking pixels and tracked links to measure
          opens and clicks. This allows users of the Service to evaluate recovery
          workflow effectiveness.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Managing Cookies</h2>
        <p className="text-text-muted">
          You can manage cookies through your browser settings. Disabling essential
          cookies may prevent some features from working correctly.
        </p>
      </section>
    </LegalShell>
  );
}

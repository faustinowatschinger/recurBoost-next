import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Increase your Stripe recovery rate - and prove it | RecurBoost",
  description:
    "If you're doing $10K-$50K MRR on Stripe, failed payments quietly reduce real revenue. RecurBoost increases your recovery rate and shows the exact lift.",
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RecurBoost",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "RecurBoost increases your Stripe recovery rate and shows exact incremental lift vs your baseline.",
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: "49",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does RecurBoost work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RecurBoost connects to Stripe, imports your last 60-90 days, calculates your recovery baseline, then tracks recovery improvement and incremental lift in dollars.",
      },
    },
    {
      "@type": "Question",
      name: "How much does RecurBoost cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RecurBoost includes 30 free days without card. Then it costs $49/month. You only pay if at least $49 was recovered during your trial.",
      },
    },
    {
      "@type": "Question",
      name: "Does RecurBoost access customer card data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. RecurBoost uses the official Stripe API and does not access customer card data.",
      },
    },
  ],
};

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default async function Home() {
  const session = process.env.MOCK_DATA !== "true" ? await auth() : null;
  const isAuthenticated = Boolean(session?.user);
  const primaryHref = isAuthenticated ? "/dashboard" : "/register";
  const primaryLabel = isAuthenticated
    ? "Go to Dashboard"
    : "Connect Stripe -> See Your Recovery Baseline";
  const secondaryHref = isAuthenticated ? "/dashboard" : "/login";
  const secondaryLabel = isAuthenticated ? "Dashboard" : "Log in";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-semibold text-xl tracking-tight">
          Recur<span className="text-primary">Boost</span>
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="#pricing"
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href={secondaryHref}
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            {secondaryLabel}
          </Link>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="text-sm px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Connect Stripe
            </Link>
          )}
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-card-border bg-card text-sm text-text-muted mb-8">
          <StripeLogo className="w-4 h-4" />
          <span>Designed for Stripe Billing users</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight">
          Your Stripe recovery rate isn&apos;t optimized.
        </h1>

        <p className="mt-6 text-base text-text-muted max-w-2xl mx-auto">
          If you&apos;re doing $10K-$50K MRR on Stripe, failed payments are quietly reducing your real revenue.
        </p>
        <p className="mt-4 text-xl text-foreground max-w-2xl mx-auto leading-relaxed">
          RecurBoost increases your Stripe recovery rate - and shows you the exact lift.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={primaryHref}
            className="inline-flex items-center px-8 py-3.5 bg-primary text-background font-semibold text-lg rounded-lg hover:bg-primary-hover transition-colors"
          >
            {primaryLabel}
            <ArrowRight />
          </Link>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          2-minute setup. No migration. No billing changes. Cancel anytime.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-text-muted">
          <span className="px-2.5 py-1 rounded border border-card-border">Built for bootstrapped SaaS founders</span>
          <span className="px-2.5 py-1 rounded border border-card-border">Uses official Stripe API</span>
          <span className="px-2.5 py-1 rounded border border-card-border">No access to customer card data</span>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-xl border border-card-border bg-card p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 leading-tight">
            Stripe retries.
            <br />
            Stripe sends reminder emails.
            <br />
            Stripe provides a portal.
            <br />
            <span className="text-text-muted">But Stripe doesn&apos;t optimize recovery for your business.</span>
          </h2>

          <div className="space-y-4 text-lg text-text-muted">
            <p>Every month:</p>
            <ul className="space-y-3 ml-5 list-disc">
              <li>Some customers never retry</li>
              <li>Some cards stay expired</li>
              <li>Some payments silently fail</li>
            </ul>
            <p className="pt-4 text-foreground font-medium text-xl">
              That revenue was already earned.
              <br />
              It just never made it back.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
          The math is simple.
        </h2>
        <p className="text-center text-text-muted mb-10">If you&apos;re at $25K MRR:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-sm text-text-muted mb-2">6% failed</p>
            <p className="text-3xl font-bold text-danger">$1,500</p>
            <p className="text-xs text-text-muted mt-1">at risk</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-sm text-text-muted mb-2">Stripe recovers ~65%</p>
            <p className="text-3xl font-bold text-text-muted">$975</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6 text-center sm:col-span-2 lg:col-span-2">
            <p className="text-sm text-text-muted mb-2">Still lost</p>
            <p className="text-3xl font-bold text-danger">$525</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
          <p className="text-text-muted mb-2">Improve recovery by 10 points?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
            <div>
              <p className="text-4xl font-bold text-primary">+$150</p>
              <p className="text-sm text-text-muted">/month</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-card-border" />
            <div>
              <p className="text-4xl font-bold text-primary">+$1,800</p>
              <p className="text-sm text-text-muted">/year</p>
            </div>
          </div>
          <p className="mt-6 text-foreground font-medium">
            Without acquiring a single new customer.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">
            We don&apos;t promise recovery.
            <br />
            We measure improvement.
          </h2>
          <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
            When you connect Stripe, we import your last 60-90 days and calculate:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-card-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-1">Historical recovery rate</h3>
            <p className="text-sm text-text-muted">Your baseline.</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-1">Current recovery rate</h3>
            <p className="text-sm text-text-muted">What is happening now.</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-1">Real incremental lift</h3>
            <p className="text-sm text-text-muted">Actual improvement vs baseline.</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6">
            <h3 className="font-semibold text-lg mb-1">Revenue recovered this month</h3>
            <p className="text-sm text-text-muted">Measured in dollars, not vanity metrics.</p>
          </div>
        </div>

        <p className="text-center mt-8 text-text-muted">
          If recovery doesn&apos;t improve, you&apos;ll see it.
        </p>
        <p className="text-center mt-2 text-foreground font-medium">
          No black box metrics. No vanity dashboards. Just recovery rate and dollars.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-xl border border-card-border bg-card p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">How it works</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckIcon />
              <p>Connect Stripe</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon />
              <p>We classify failed payments by decline type</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon />
              <p>We trigger optimized recovery sequences</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon />
              <p>We track actual payment recovery</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon />
              <p>We calculate real lift vs baseline</p>
            </div>
          </div>

          <p className="mt-8 text-foreground font-medium">That&apos;s it.</p>
          <p className="mt-4 text-text-muted">No billing migration. No replacing Stripe. No workflow changes.</p>
          <p className="mt-1 text-text-muted">Works on top of your existing Stripe setup.</p>
        </div>
      </section>

      <section id="pricing" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold">One plan. No complexity.</h2>
          <p className="mt-4 text-lg text-text-muted">30 days free. No credit card required.</p>
        </div>

        <div className="max-w-md mx-auto rounded-xl border border-card-border bg-card p-8 flex flex-col text-center">
          <p className="text-4xl font-bold mb-2">$49/month</p>
          <p className="text-text-muted">You only pay if we recover at least $49 during your trial.</p>
          <p className="mt-3 text-foreground font-medium">If we don&apos;t generate value, you don&apos;t pay.</p>

          <Link
            href={primaryHref}
            className="mt-6 inline-flex items-center justify-center px-8 py-3.5 bg-primary text-background font-semibold text-lg rounded-lg hover:bg-primary-hover transition-colors"
          >
            {isAuthenticated ? "Open Dashboard" : "Connect with Stripe"}
            <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Stop leaking revenue from failed Stripe payments.
        </h2>
        <div className="space-y-2 text-lg text-text-muted mb-10">
          <p>Connect Stripe.</p>
          <p>See your real recovery rate.</p>
          <p>Improve what&apos;s already yours.</p>
        </div>
        <Link
          href={primaryHref}
          className="inline-flex items-center px-8 py-3.5 bg-primary text-background font-semibold text-lg rounded-lg hover:bg-primary-hover transition-colors"
        >
          {isAuthenticated ? "Go to Dashboard" : "Connect with Stripe"}
          <ArrowRight />
        </Link>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-card-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-semibold text-sm tracking-tight">
          Recur<span className="text-primary">Boost</span>
        </span>
        <p className="text-sm text-text-muted">Built for technical SaaS founders.</p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}

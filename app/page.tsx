import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recover More Failed Stripe Payments Than Stripe Does",
  description:
    "RecurBoost recovers more failed Stripe payments automatically. Increase your real MRR with smart recovery sequences. Plans from $59/mo. 30-day free trial.",
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
    "Recover more failed Stripe payments than Stripe does. Increase your real MRR automatically with smart recovery sequences for SaaS.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "59",
    highPrice: "199",
    offerCount: "3",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does RecurBoost recover failed Stripe payments?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RecurBoost connects to your Stripe account, imports your last 60-90 days of data, calculates your baseline recovery rate, and deploys smart recovery sequences to improve it. We measure real incremental lift so you see exactly what we recover.",
      },
    },
    {
      "@type": "Question",
      name: "How much does RecurBoost cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plans start at $59/month for up to $1,000 at risk, $119/month for up to $3,000, and $199/month for up to $8,000. Your plan is automatically assigned based on your Stripe data after a 30-day free trial.",
      },
    },
    {
      "@type": "Question",
      name: "Does RecurBoost require any migration or billing changes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. RecurBoost works with your existing Stripe setup. Connect in 2 minutes, no migration needed, no billing changes required. Cancel anytime.",
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

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
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
            href="/login"
            className="text-sm text-text-muted hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Connect Stripe
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-card-border bg-card text-sm text-text-muted mb-8">
          <StripeLogo className="w-4 h-4" />
          <span>Works with your existing Stripe setup</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight">
          Recover More Failed Stripe Payments{" "}
          <span className="text-primary">Than Stripe Does.</span>
        </h1>

        <p className="mt-6 text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          Increase Your Real MRR — Automatically.
        </p>
        <p className="mt-4 text-base text-text-muted max-w-xl mx-auto">
          If you&apos;re doing $10K–$50K MRR on Stripe, you&apos;re quietly losing revenue
          every month. We recover more of it. And we prove it.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3.5 bg-primary text-background font-semibold text-lg rounded-lg hover:bg-primary-hover transition-colors"
          >
            Connect Stripe
            <ArrowRight />
          </Link>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          2-minute setup. No migration. No billing changes. Cancel anytime.
        </p>
      </section>

      {/* Problem */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-xl border border-card-border bg-card p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            Stripe retries. Stripe sends emails.
            <br />
            <span className="text-text-muted">But Stripe doesn&apos;t optimize recovery.</span>
          </h2>

          <div className="space-y-4 text-lg text-text-muted">
            <p>Every month:</p>
            <ul className="space-y-3 ml-1">
              <li className="flex items-start gap-3">
                <span className="text-danger mt-1">&#x2717;</span>
                Some customers never retry.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-danger mt-1">&#x2717;</span>
                Some cards stay expired.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-danger mt-1">&#x2717;</span>
                Some payments silently die.
              </li>
            </ul>
            <p className="pt-4 text-foreground font-medium text-xl">
              That&apos;s revenue you already earned.
              <br />
              And you&apos;re leaving it there.
            </p>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
          The math is simple.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-sm text-text-muted mb-2">Your MRR</p>
            <p className="text-3xl font-bold">$25K</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-sm text-text-muted mb-2">6% failed</p>
            <p className="text-3xl font-bold text-danger">$1,500</p>
            <p className="text-xs text-text-muted mt-1">at risk</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-sm text-text-muted mb-2">Stripe recovers ~65%</p>
            <p className="text-3xl font-bold text-text-muted">$975</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6 text-center">
            <p className="text-sm text-text-muted mb-2">Still lost</p>
            <p className="text-3xl font-bold text-danger">$525</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
          <p className="text-text-muted mb-2">Improve recovery by just 10 points?</p>
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

      {/* Differentiator */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">
            We don&apos;t guess.
          </h2>
          <p className="mt-4 text-lg text-text-muted max-w-xl mx-auto">
            When you connect Stripe, we import your last 60–90 days and calculate:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-card-border bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1">Historical recovery rate</h3>
            <p className="text-sm text-text-muted">Your baseline before RecurBoost.</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1">Current recovery rate</h3>
            <p className="text-sm text-text-muted">What&apos;s happening right now.</p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1">Real incremental lift</h3>
            <p className="text-sm text-text-muted">The revenue we actually added.</p>
          </div>
        </div>

        <p className="text-center mt-8 text-text-muted">
          If we don&apos;t improve it — you&apos;ll see it. <span className="text-foreground font-medium">No vanity metrics.</span>
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Simple pricing. Based on your numbers.
          </h2>
          <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
            Connect Stripe, get 30 days free. We analyze your failed payments and assign the right plan automatically.
            If we don&apos;t recover at least your subscription cost — you don&apos;t pay.
          </p>
        </div>

        {/* How it works steps */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-14 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
            <span>Connect Stripe</span>
          </div>
          <span className="hidden sm:block text-card-border">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
            <span>30 days free</span>
          </div>
          <span className="hidden sm:block text-card-border">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
            <span>Auto-assigned plan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Starter */}
          <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col">
            <p className="text-sm text-text-muted mb-1">Starter</p>
            <p className="text-sm text-text-muted mb-4">Up to <span className="text-foreground font-medium">$1,000</span> at risk/mo</p>
            <p className="text-4xl font-bold mb-1">$59<span className="text-lg font-normal text-text-muted">/mo</span></p>
            <div className="mt-6 space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Real-time Stripe integration</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Baseline + lift analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Smart recovery sequences</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Growth */}
          <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col">
            <p className="text-sm text-text-muted mb-1">Growth</p>
            <p className="text-sm text-text-muted mb-4">Up to <span className="text-foreground font-medium">$3,000</span> at risk/mo</p>
            <p className="text-4xl font-bold mb-1">$119<span className="text-lg font-normal text-text-muted">/mo</span></p>
            <div className="mt-6 space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Everything in Starter</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Advanced retry optimization</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Priority recovery queue</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Email support</span>
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="rounded-xl border border-card-border bg-card p-8 flex flex-col">
            <p className="text-sm text-text-muted mb-1">Scale</p>
            <p className="text-sm text-text-muted mb-4">Up to <span className="text-foreground font-medium">$8,000</span> at risk/mo</p>
            <p className="text-4xl font-bold mb-1">$199<span className="text-lg font-normal text-text-muted">/mo</span></p>
            <div className="mt-6 space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Everything in Growth</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Custom recovery sequences</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Dedicated account manager</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3.5 bg-primary text-background font-semibold text-lg rounded-lg hover:bg-primary-hover transition-colors"
          >
            Start 30-day free trial
            <ArrowRight />
          </Link>
          <p className="mt-3 text-sm text-text-muted">
            No credit card required. We&apos;ll calculate your plan from your Stripe data.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Stop leaking Stripe revenue.
        </h2>
        <div className="space-y-2 text-lg text-text-muted mb-10">
          <p>Connect Stripe.</p>
          <p>See your baseline.</p>
          <p>Start recovering what&apos;s already yours.</p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-3.5 bg-primary text-background font-semibold text-lg rounded-lg hover:bg-primary-hover transition-colors"
        >
          Connect with Stripe
          <ArrowRight />
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-card-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-semibold text-sm tracking-tight">
          Recur<span className="text-primary">Boost</span>
        </span>
        <p className="text-sm text-text-muted">
          Revenue precision for SaaS.
        </p>
      </footer>

      {/* Structured Data */}
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

"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import posthog from "posthog-js";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-foreground">Loading...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

type Step = 1 | 2 | 3 | 4;

function OnboardingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);

  // Step 2 state
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [webhookAutoConfigured, setWebhookAutoConfigured] = useState(false);

  // Step 3 state
  const [webhookSecret, setWebhookSecret] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState("");

  // Step 4 state
  const [importing, setImporting] = useState(false);

  const error = searchParams.get("error");

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/stripe/status");
        const data = await res.json();
        if (data.billingStatus === "canceled") {
          router.push("/billing");
          return;
        }
        if (data.connected && data.baselineCalculated) {
          router.push("/dashboard");
          return;
        }
        if (data.connected && data.webhookConfigured) {
          setStep(4);
        } else if (data.connected) {
          setStep(3);
        } else {
          setStep(1);
        }
      } catch {
        // not connected
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [router]);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setConnectError("");

    try {
      const res = await fetch("/api/stripe/byok/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConnectError(data.error || "Failed to connect");
        return;
      }

      setApiKey("");
      posthog.capture('stripe_api_key_connected', {
        webhook_auto_configured: !!data.webhookConfigured,
      });
      if (data.webhookConfigured) {
        setWebhookAutoConfigured(true);
        setStep(4);
      } else {
        setStep(3);
      }
    } catch {
      setConnectError("Connection error. Please try again.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSavingWebhook(true);
    setWebhookError("");

    try {
      const res = await fetch("/api/stripe/byok/webhook-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookSecret }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWebhookError(data.error || "Failed to save");
        return;
      }

      posthog.capture('stripe_webhook_configured');
      setWebhookSecret("");
      setStep(4);
    } catch {
      setWebhookError("Connection error. Please try again.");
    } finally {
      setSavingWebhook(false);
    }
  }

  async function handleImportBaseline() {
    setImporting(true);
    try {
      const res = await fetch("/api/stripe/baseline", { method: "POST" });
      if (res.ok) {
        posthog.capture('onboarding_baseline_imported');
        router.push("/dashboard");
      }
    } catch {
      // handle error
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Create API Key" },
    { num: 2, label: "Connect" },
    { num: 3, label: "Webhook" },
    { num: 4, label: "Finish" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl py-12 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Set up your account
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {session?.user?.name
              ? `Welcome, ${session.user.name}. `
              : ""}
            You&apos;ll be ready to recover payments in 3 minutes.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    s.num < step
                      ? "bg-primary text-background"
                      : s.num === step
                        ? "bg-primary text-background ring-4 ring-primary/20"
                        : "bg-card border-2 border-card-border text-text-muted"
                  }`}
                >
                  {s.num < step ? "\u2713" : s.num}
                </div>
                <span
                  className={`mt-1.5 text-xs ${
                    s.num <= step ? "text-foreground font-medium" : "text-text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                    s.num < step ? "bg-primary" : "bg-card-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error from redirect */}
        {error && (
          <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
            Failed to connect Stripe: {error.replace(/_/g, " ")}
          </div>
        )}

        {/* Step 1: Guide to create API Key */}
        {step === 1 && (
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 1: Create a Stripe API Key
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                We need a key to access your billing data.
                We recommend using a <strong className="text-foreground">Restricted Key</strong> for security.
              </p>
            </div>

            <ol className="space-y-3 text-sm text-text-muted">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary-hover font-medium"
                  >
                    Stripe Dashboard &rarr; API Keys
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span>
                  Click <strong className="text-foreground">&ldquo;Create restricted key&rdquo;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <span>Enable these permissions:</span>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { name: "Balance", perm: "Read" },
                      { name: "Customers", perm: "Read" },
                      { name: "Invoices", perm: "Read" },
                      { name: "Subscriptions", perm: "Read" },
                      { name: "PaymentIntents", perm: "Read" },
                      { name: "Customer portal", perm: "Write" },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-background border border-card-border rounded-md"
                      >
                        <span className="text-xs text-foreground">{p.name}</span>
                        <span className={`text-xs font-medium ${p.perm === "Write" ? "text-warning" : "text-primary"}`}>
                          {p.perm}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <span>
                  Click <strong className="text-foreground">&ldquo;Create key&rdquo;</strong> and copy the generated key
                </span>
              </li>
            </ol>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 px-4 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              I have my API Key
            </button>

            <p className="text-center text-xs text-text-muted">
              If you already have a Secret Key (sk_...) that works too, but a Restricted Key is more secure.
            </p>
          </div>
        )}

        {/* Step 2: Paste API Key */}
        {step === 2 && (
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 2: Connect your API Key
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Paste the key you copied in the previous step. We&apos;ll validate it instantly.
              </p>
            </div>

            {connectError && (
              <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
                {connectError}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-foreground">
                  Stripe API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="rk_live_... or sk_live_..."
                  className="mt-1 block w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm text-text-muted border border-card-border rounded-lg hover:bg-card-border/20 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={connecting || !apiKey}
                  className="flex-1 py-2.5 px-4 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting ? "Validating with Stripe..." : "Connect"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Webhook */}
        {step === 3 && (
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
                API Key connected
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 3: Set up the Webhook
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                The webhook notifies RecurBoost when a payment fails, so we can act instantly.
              </p>
            </div>

            <ol className="space-y-3 text-sm text-text-muted">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://dashboard.stripe.com/webhooks/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary-hover font-medium"
                  >
                    Stripe Dashboard &rarr; Webhooks &rarr; Create
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <div className="space-y-1.5">
                  <span>In <strong className="text-foreground">Endpoint URL</strong> paste:</span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-background border border-card-border rounded-lg text-xs text-foreground select-all break-all">
                      {typeof window !== "undefined" ? window.location.origin : ""}/api/stripe/webhooks
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/api/stripe/webhooks`
                        );
                      }}
                      className="flex-shrink-0 px-2.5 py-2 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <div className="space-y-1.5">
                  <span>In <strong className="text-foreground">Events to send</strong>, search and select:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["invoice.payment_failed", "invoice.paid", "customer.subscription.updated"].map((evt) => (
                      <code
                        key={evt}
                        className="px-2 py-1 bg-background border border-card-border rounded-md text-xs text-foreground"
                      >
                        {evt}
                      </code>
                    ))}
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <span>Click <strong className="text-foreground">&ldquo;Add endpoint&rdquo;</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
                <span>
                  On the endpoint page, click <strong className="text-foreground">&ldquo;Reveal&rdquo;</strong> next to{" "}
                  <strong className="text-foreground">Signing secret</strong> and copy it
                </span>
              </li>
            </ol>

            {webhookError && (
              <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
                {webhookError}
              </div>
            )}

            <form onSubmit={handleSaveWebhook} className="space-y-3">
              <div>
                <label htmlFor="webhookSecret" className="block text-sm font-medium text-foreground">
                  Signing secret
                </label>
                <input
                  id="webhookSecret"
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="mt-1 block w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={savingWebhook || !webhookSecret}
                className="w-full py-2.5 px-4 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingWebhook ? "Verifying..." : "Save and continue"}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Import baseline */}
        {step === 4 && (
          <div className="bg-card border border-card-border rounded-xl p-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
                {webhookAutoConfigured ? "Stripe connected + Automatic webhook" : "Stripe connected + Webhook configured"}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Step 4: Import historical data
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                We&apos;ll analyze the last 90 days of your account to calculate your current recovery rate.
                This way we can show you how much we improve it.
              </p>
            </div>

            <div className="p-4 bg-background border border-card-border rounded-lg space-y-2">
              <p className="text-sm text-foreground font-medium">What we&apos;ll do:</p>
              <ul className="text-sm text-text-muted space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#10003;</span>
                  Read failed invoices from the last 90 days
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#10003;</span>
                  Calculate your current recovery rate (baseline)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">&#10003;</span>
                  Activate automatic recovery
                </li>
              </ul>
            </div>

            <button
              onClick={handleImportBaseline}
              disabled={importing}
              className="w-full py-3 px-4 bg-primary text-background font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {importing ? "Importing data... this may take a few seconds" : "Import and activate recovery"}
            </button>
          </div>
        )}

        {/* Help footer */}
        <p className="text-center text-xs text-text-muted">
          Need help?{" "}
          <a href="mailto:support@recurboost.com" className="text-primary underline hover:text-primary-hover">
            support@recurboost.com
          </a>
        </p>
      </div>
    </div>
  );
}

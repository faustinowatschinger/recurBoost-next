"use client";

import { useEffect, useState } from "react";

interface SettingsData {
  user: {
    email: string;
    companyName: string;
    companyLogo: string;
    senderName: string;
    brandColor: string;
    brandButtonColor: string;
    brandButtonTextColor: string;
  } | null;
  stripe: {
    connected: boolean;
    stripeAccountId?: string;
    apiKeyLast4?: string;
    baselineRecoveryRate?: number;
    baselineCalculatedAt?: string;
    webhookConfigured?: boolean;
  };
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [senderName, setSenderName] = useState("");
  const [brandColor, setBrandColor] = useState("#635bff");
  const [brandButtonColor, setBrandButtonColor] = useState("#635bff");
  const [brandButtonTextColor, setBrandButtonTextColor] = useState("#ffffff");
  const [disconnecting, setDisconnecting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [showRotateForm, setShowRotateForm] = useState(false);
  const [actionError, setActionError] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const settings: SettingsData = await res.json();
        setData(settings);
        if (settings.user) {
          setCompanyName(settings.user.companyName);
          setCompanyLogo(settings.user.companyLogo);
          setSenderName(settings.user.senderName);
          setBrandColor(settings.user.brandColor || "#635bff");
          setBrandButtonColor(settings.user.brandButtonColor || "#635bff");
          setBrandButtonTextColor(settings.user.brandButtonTextColor || "#ffffff");
        }
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companyLogo,
          senderName,
          brandColor,
          brandButtonColor,
          brandButtonTextColor,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect Stripe? Recovery emails will stop.")) {
      return;
    }

    setDisconnecting(true);
    setActionError("");

    try {
      const res = await fetch("/api/stripe/byok/disconnect", { method: "POST" });
      if (res.ok) {
        await fetchSettings();
      } else {
        const result = await res.json();
        setActionError(result.error || "Failed to disconnect");
      }
    } catch {
      setActionError("Connection error");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSaveWebhookSecret(e: React.FormEvent) {
    e.preventDefault();
    setSavingWebhook(true);
    setActionError("");

    try {
      const res = await fetch("/api/stripe/byok/webhook-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookSecret }),
      });

      if (res.ok) {
        setWebhookSecret("");
        await fetchSettings();
      } else {
        const result = await res.json();
        setActionError(result.error || "Failed to save webhook secret");
      }
    } catch {
      setActionError("Connection error");
    } finally {
      setSavingWebhook(false);
    }
  }

  async function handleRotate(e: React.FormEvent) {
    e.preventDefault();
    setRotating(true);
    setActionError("");

    try {
      const res = await fetch("/api/stripe/byok/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKey }),
      });

      if (res.ok) {
        setNewApiKey("");
        setShowRotateForm(false);
        await fetchSettings();
      } else {
        const result = await res.json();
        setActionError(result.error || "Failed to rotate credentials");
      }
    } catch {
      setActionError("Connection error");
    } finally {
      setRotating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Customize the recovery emails your customers receive
        </p>
      </div>

      {/* Company Settings */}
      <form onSubmit={handleSave} className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Email customization</h2>
        <p className="text-sm text-text-muted">
          This information appears in the recovery emails sent to your customers.
        </p>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
            Company name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Acme Inc."
          />
        </div>

        <div>
          <label htmlFor="senderName" className="block text-sm font-medium text-foreground">
            Sender name
          </label>
          <input
            id="senderName"
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Support Team"
          />
          <p className="mt-1 text-xs text-text-muted">
            Shown as &quot;From: Name &lt;email&gt;&quot; in emails
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Company logo
          </label>
          <div className="mt-1 flex items-center gap-4">
            {companyLogo && (
              <div className="p-2 bg-background border border-card-border rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={companyLogo} alt="Current logo" className="max-h-12" />
              </div>
            )}
            <div className="flex-1">
              <label
                htmlFor="logoUpload"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-card-border cursor-pointer transition-colors ${
                  uploadingLogo
                    ? "opacity-50 cursor-not-allowed bg-card text-text-muted"
                    : "bg-card text-foreground hover:bg-card-border/20"
                }`}
              >
                {uploadingLogo ? "Uploading..." : companyLogo ? "Change logo" : "Upload logo"}
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  disabled={uploadingLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingLogo(true);
                    try {
                      const formData = new FormData();
                      formData.append("logo", file);
                      const res = await fetch("/api/settings/upload-logo", {
                        method: "POST",
                        body: formData,
                      });
                      if (res.ok) {
                        const { url } = await res.json();
                        setCompanyLogo(url);
                      } else {
                        const result = await res.json();
                        alert(result.error || "Failed to upload logo");
                      }
                    } catch {
                      alert("Connection error while uploading logo");
                    } finally {
                      setUploadingLogo(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              <p className="mt-1.5 text-xs text-text-muted">
                PNG, JPG, WebP or SVG. Max 512KB.
              </p>
            </div>
            {companyLogo && (
              <button
                type="button"
                onClick={() => setCompanyLogo("")}
                className="text-xs text-danger hover:text-danger/80 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Displayed in the header of recovery emails.
          </p>
        </div>

        {/* Brand Colors */}
        <div className="pt-2 border-t border-card-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Email colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="brandColor" className="block text-xs text-text-muted mb-1">
                Brand color (header/text)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-card-border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs bg-background border border-card-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label htmlFor="brandButtonColor" className="block text-xs text-text-muted mb-1">
                Button color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="brandButtonColor"
                  type="color"
                  value={brandButtonColor}
                  onChange={(e) => setBrandButtonColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-card-border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={brandButtonColor}
                  onChange={(e) => setBrandButtonColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs bg-background border border-card-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label htmlFor="brandButtonTextColor" className="block text-xs text-text-muted mb-1">
                Button text
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="brandButtonTextColor"
                  type="color"
                  value={brandButtonTextColor}
                  onChange={(e) => setBrandButtonTextColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-card-border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={brandButtonTextColor}
                  onChange={(e) => setBrandButtonTextColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs bg-background border border-card-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Preview */}
        <div className="pt-2 border-t border-card-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Email preview</h3>
          <div className="rounded-lg overflow-hidden border border-card-border">
            <div className="bg-[#f9fafb] p-4">
              <div className="max-w-md mx-auto bg-white rounded-lg border border-[#e5e7eb] p-6">
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companyLogo} alt="Logo" className="max-h-12 mb-4" />
                ) : (
                  <p className="text-lg font-semibold mb-4" style={{ color: brandColor }}>
                    {companyName || "Your Company"}
                  </p>
                )}
                <p className="text-sm text-[#374151] mb-2">Hi,</p>
                <p className="text-sm text-[#374151] mb-4">
                  There was an issue processing your payment of <strong>$49.00</strong>.
                  Please update your payment method.
                </p>
                <span
                  className="inline-block px-5 py-2.5 rounded-md text-sm font-semibold"
                  style={{
                    backgroundColor: brandButtonColor,
                    color: brandButtonTextColor,
                  }}
                >
                  Update payment method
                </span>
                <p className="mt-6 text-xs text-[#9ca3af]">
                  This email was sent by {companyName || "Your Company"}.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm text-primary">Saved successfully</span>
          )}
        </div>
      </form>

      {/* Stripe Connection Info */}
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Stripe connection</h2>

        {actionError && (
          <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
            {actionError}
          </div>
        )}

        {data?.stripe.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm text-foreground">Connected (BYOK)</span>
            </div>

            <div className="text-sm text-text-muted space-y-1">
              <p>
                Account ID: <code className="text-xs bg-background border border-card-border px-1.5 py-0.5 rounded text-foreground">{data.stripe.stripeAccountId}</code>
              </p>
              <p>
                API Key: <code className="text-xs bg-background border border-card-border px-1.5 py-0.5 rounded text-foreground">{data.stripe.apiKeyLast4}</code>
              </p>
              <p>
                Webhook:{" "}
                {data.stripe.webhookConfigured ? (
                  <span className="text-primary">Configured</span>
                ) : (
                  <span className="text-warning">Not configured — paste the signing secret below</span>
                )}
              </p>
              {data.stripe.baselineRecoveryRate != null && (
                <p>
                  Baseline Recovery Rate: <strong className="text-foreground">{data.stripe.baselineRecoveryRate}%</strong>
                  {data.stripe.baselineCalculatedAt && (
                    <span className="ml-2 text-xs text-text-muted">
                      (calculated {new Date(data.stripe.baselineCalculatedAt).toLocaleDateString("en-US")})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Webhook Secret — always visible so user can update */}
            <form onSubmit={handleSaveWebhookSecret} className={`p-4 bg-background border rounded-lg space-y-3 ${data.stripe.webhookConfigured ? "border-card-border" : "border-warning/30"}`}>
              <p className="text-sm font-medium text-foreground">
                {data.stripe.webhookConfigured ? "Update Webhook Secret" : "Set up Webhook"}
              </p>
              {!data.stripe.webhookConfigured && (
                <>
                  <p className="text-xs text-text-muted">
                    To detect failed payments, you need to create a webhook in Stripe:
                  </p>
                  <ol className="text-xs text-text-muted space-y-1.5 list-decimal list-inside">
                    <li>
                      Go to{" "}
                      <a
                        href="https://dashboard.stripe.com/webhooks/create"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary-hover"
                      >
                        Stripe Dashboard &gt; Webhooks
                      </a>
                    </li>
                    <li>
                      In <strong className="text-foreground">Endpoint URL</strong> paste:{" "}
                      <code className="bg-card border border-card-border px-1.5 py-0.5 rounded text-foreground select-all">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/stripe/webhooks
                      </code>
                    </li>
                    <li>
                      In <strong className="text-foreground">Events</strong> select:{" "}
                      <code className="bg-card border border-card-border px-1 rounded text-foreground">invoice.payment_failed</code>,{" "}
                      <code className="bg-card border border-card-border px-1 rounded text-foreground">invoice.paid</code>,{" "}
                      <code className="bg-card border border-card-border px-1 rounded text-foreground">customer.subscription.updated</code>
                    </li>
                    <li>Click <strong className="text-foreground">Add endpoint</strong></li>
                    <li>Copy the <strong className="text-foreground">Signing secret</strong> (starts with <code className="bg-card border border-card-border px-1 rounded">whsec_</code>) and paste it below</li>
                  </ol>
                </>
              )}
              {data.stripe.webhookConfigured && (
                <p className="text-xs text-text-muted">
                  If you created a new webhook endpoint in Stripe, paste the new signing secret here to replace the current one.
                </p>
              )}
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="block w-full px-3 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
              <button
                type="submit"
                disabled={savingWebhook || !webhookSecret}
                className="px-3 py-1.5 text-sm bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {savingWebhook ? "Saving..." : data.stripe.webhookConfigured ? "Update webhook secret" : "Save webhook secret"}
              </button>
            </form>

            {/* Rotate credentials */}
            {showRotateForm ? (
              <form onSubmit={handleRotate} className="p-4 bg-background border border-card-border rounded-lg space-y-3">
                <p className="text-sm font-medium text-foreground">Rotate API Key</p>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk_test_... or rk_test_..."
                  className="block w-full px-3 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={rotating || !newApiKey}
                    className="px-3 py-1.5 text-sm bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {rotating ? "Validating..." : "Save new key"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRotateForm(false); setNewApiKey(""); }}
                    className="px-3 py-1.5 text-sm text-text-muted border border-card-border rounded-lg hover:bg-card-border/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRotateForm(true)}
                  className="px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Rotate credentials
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-1.5 text-sm text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect Stripe"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-text-muted">
              You don&apos;t have a Stripe account connected.
            </p>
            <a
              href="/onboarding"
              className="mt-3 inline-block px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Go to onboarding to connect
            </a>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-2">
        <h2 className="font-semibold text-foreground">Account</h2>
        <p className="text-sm text-text-muted">
          Email: <strong className="text-foreground">{data?.user?.email}</strong>
        </p>
      </div>
    </div>
  );
}

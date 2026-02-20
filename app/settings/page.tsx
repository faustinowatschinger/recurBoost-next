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
    if (!confirm("¿Estás seguro de que querés desconectar Stripe? Se detendrán los emails de recuperación.")) {
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
        setActionError(result.error || "Error al desconectar");
      }
    } catch {
      setActionError("Error de conexión");
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
        setActionError(result.error || "Error al guardar webhook secret");
      }
    } catch {
      setActionError("Error de conexión");
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
        setActionError(result.error || "Error al rotar credenciales");
      }
    } catch {
      setActionError("Error de conexión");
    } finally {
      setRotating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-text-muted mt-1">
          Personalizá los emails de recuperación que reciben tus clientes
        </p>
      </div>

      {/* Company Settings */}
      <form onSubmit={handleSave} className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Personalización de emails</h2>
        <p className="text-sm text-text-muted">
          Esta información aparece en los emails de recuperación enviados a tus clientes.
        </p>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
            Nombre de la empresa
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Tu Empresa S.A."
          />
        </div>

        <div>
          <label htmlFor="senderName" className="block text-sm font-medium text-foreground">
            Nombre del remitente
          </label>
          <input
            id="senderName"
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Equipo de Soporte"
          />
          <p className="mt-1 text-xs text-text-muted">
            Aparece como &quot;De: Nombre &lt;email&gt;&quot; en los emails
          </p>
        </div>

        <div>
          <label htmlFor="companyLogo" className="block text-sm font-medium text-foreground">
            URL del logo
          </label>
          <input
            id="companyLogo"
            type="url"
            value={companyLogo}
            onChange={(e) => setCompanyLogo(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-background border border-card-border rounded-lg text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://tu-empresa.com/logo.png"
          />
          <p className="mt-1 text-xs text-text-muted">
            Se muestra en el header de los emails de recuperación.
          </p>
          {companyLogo && (
            <div className="mt-2 p-3 bg-background border border-card-border rounded-lg inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={companyLogo} alt="Logo preview" className="max-h-12" />
            </div>
          )}
        </div>

        {/* Brand Colors */}
        <div className="pt-2 border-t border-card-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Colores del email</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="brandColor" className="block text-xs text-text-muted mb-1">
                Color de marca (header/texto)
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
                Color del botón
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
                Texto del botón
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
          <h3 className="text-sm font-medium text-foreground mb-3">Preview del email</h3>
          <div className="rounded-lg overflow-hidden border border-card-border">
            <div className="bg-[#f9fafb] p-4">
              <div className="max-w-md mx-auto bg-white rounded-lg border border-[#e5e7eb] p-6">
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companyLogo} alt="Logo" className="max-h-12 mb-4" />
                ) : (
                  <p className="text-lg font-semibold mb-4" style={{ color: brandColor }}>
                    {companyName || "Tu Empresa"}
                  </p>
                )}
                <p className="text-sm text-[#374151] mb-2">Hola,</p>
                <p className="text-sm text-[#374151] mb-4">
                  Hubo un problema al procesar tu pago de <strong>$49.00</strong>.
                  Por favor, revisá tu método de pago.
                </p>
                <span
                  className="inline-block px-5 py-2.5 rounded-md text-sm font-semibold"
                  style={{
                    backgroundColor: brandButtonColor,
                    color: brandButtonTextColor,
                  }}
                >
                  Actualizar método de pago
                </span>
                <p className="mt-6 text-xs text-[#9ca3af]">
                  Este email fue enviado por {companyName || "Tu Empresa"}.
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
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <span className="text-sm text-primary">Guardado correctamente</span>
          )}
        </div>
      </form>

      {/* Stripe Connection Info */}
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Conexión con Stripe</h2>

        {actionError && (
          <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
            {actionError}
          </div>
        )}

        {data?.stripe.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm text-foreground">Conectado (BYOK)</span>
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
                  <span className="text-primary">Configurado</span>
                ) : (
                  <span className="text-warning">No configurado — pegá el signing secret abajo</span>
                )}
              </p>
              {data.stripe.baselineRecoveryRate != null && (
                <p>
                  Baseline Recovery Rate: <strong className="text-foreground">{data.stripe.baselineRecoveryRate}%</strong>
                  {data.stripe.baselineCalculatedAt && (
                    <span className="ml-2 text-xs text-text-muted">
                      (calculado {new Date(data.stripe.baselineCalculatedAt).toLocaleDateString("es-AR")})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Webhook Secret (if not configured) */}
            {!data.stripe.webhookConfigured && (
              <form onSubmit={handleSaveWebhookSecret} className="p-4 bg-background border border-warning/30 rounded-lg space-y-3">
                <p className="text-sm font-medium text-foreground">Configurar Webhook Secret</p>
                <p className="text-xs text-text-muted">
                  Ejecutá <code className="bg-card border border-card-border px-1 rounded">stripe listen --forward-to localhost:3000/api/stripe/webhooks</code> y pegá el signing secret acá.
                </p>
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
                  {savingWebhook ? "Guardando..." : "Guardar webhook secret"}
                </button>
              </form>
            )}

            {/* Rotate credentials */}
            {showRotateForm ? (
              <form onSubmit={handleRotate} className="p-4 bg-background border border-card-border rounded-lg space-y-3">
                <p className="text-sm font-medium text-foreground">Rotar API Key</p>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk_test_... o rk_test_..."
                  className="block w-full px-3 py-2 bg-card border border-card-border rounded-lg text-foreground placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={rotating || !newApiKey}
                    className="px-3 py-1.5 text-sm bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {rotating ? "Validando..." : "Guardar nueva key"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRotateForm(false); setNewApiKey(""); }}
                    className="px-3 py-1.5 text-sm text-text-muted border border-card-border rounded-lg hover:bg-card-border/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRotateForm(true)}
                  className="px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Rotar credenciales
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-1.5 text-sm text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? "Desconectando..." : "Desconectar Stripe"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-text-muted">
              No tenés una cuenta de Stripe conectada.
            </p>
            <a
              href="/onboarding"
              className="mt-3 inline-block px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
            >
              Ir al onboarding para conectar
            </a>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-card border border-card-border rounded-xl p-6 space-y-2">
        <h2 className="font-semibold text-foreground">Cuenta</h2>
        <p className="text-sm text-text-muted">
          Email: <strong className="text-foreground">{data?.user?.email}</strong>
        </p>
      </div>
    </div>
  );
}

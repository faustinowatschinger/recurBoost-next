"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <p className="text-[var(--foreground)]">Cargando...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [connectError, setConnectError] = useState("");
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const error = searchParams.get("error");

  useEffect(() => {
    async function checkStripeConnection() {
      try {
        const res = await fetch("/api/stripe/status");
        const data = await res.json();
        setStripeConnected(data.connected);
        setWebhookConfigured(data.webhookConfigured);
        if (data.connected && data.baselineCalculated) {
          router.push("/dashboard");
        }
      } catch {
        // not connected
      } finally {
        setLoading(false);
      }
    }
    checkStripeConnection();
  }, [router]);

  async function handleConnectBYOK(e: React.FormEvent) {
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
        setConnectError(data.error || "Error al conectar");
        return;
      }

      setStripeConnected(true);
      setWebhookConfigured(data.webhookConfigured);
      setApiKey("");
    } catch {
      setConnectError("Error de conexión. Intentá de nuevo.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleImportBaseline() {
    setImporting(true);
    try {
      const res = await fetch("/api/stripe/baseline", { method: "POST" });
      if (res.ok) {
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--foreground)]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-lg p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Configurá tu cuenta
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {session?.user?.name
              ? `Bienvenido, ${session.user.name}`
              : "Conectá tu cuenta de Stripe para empezar"}
          </p>
        </div>

        {(error || connectError) && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {connectError || `Error al conectar Stripe: ${error?.replace(/_/g, " ")}`}
          </div>
        )}

        {/* Step 1: Connect Stripe via API Key (BYOK) */}
        <div className={`p-6 border rounded-lg ${stripeConnected ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${stripeConnected ? "bg-green-500" : "bg-blue-600"}`}>
              {stripeConnected ? "\u2713" : "1"}
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Conectar Stripe
              </h2>
              <p className="text-sm text-gray-500">
                {stripeConnected
                  ? "Cuenta de Stripe conectada correctamente"
                  : "Ingresá tu API Key de Stripe para conectar tu cuenta"}
              </p>
            </div>
          </div>

          {!stripeConnected && (
            <form onSubmit={handleConnectBYOK} className="mt-4 space-y-3">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  Stripe Secret Key o Restricted Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_test_... o rk_test_..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Encontrala en{" "}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Stripe Dashboard &rarr; API Keys
                  </a>
                  . Recomendamos usar una Restricted Key con permisos de lectura en invoices, customers, subscriptions y payment_intents, y escritura en billing_portal.sessions.
                </p>
              </div>

              <button
                type="submit"
                disabled={connecting || !apiKey}
                className="w-full py-2 px-4 bg-[#635bff] text-white rounded-md hover:bg-[#5046e4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? "Validando..." : "Conectar con API Key"}
              </button>
            </form>
          )}

          {stripeConnected && !webhookConfigured && (
            <div className="mt-3 p-3 text-sm text-amber-700 bg-amber-50 rounded-md">
              No se pudo configurar el webhook automáticamente. Crealo manualmente en Stripe Dashboard
              apuntando a <code className="text-xs bg-amber-100 px-1 rounded">{typeof window !== "undefined" ? window.location.origin : ""}/api/stripe/webhooks</code> con
              los eventos: <code className="text-xs bg-amber-100 px-1 rounded">invoice.payment_failed</code>, <code className="text-xs bg-amber-100 px-1 rounded">invoice.paid</code>, <code className="text-xs bg-amber-100 px-1 rounded">customer.subscription.updated</code>.
            </div>
          )}
        </div>

        {/* Step 2: Import Baseline */}
        <div className={`p-6 border rounded-lg ${!stripeConnected ? "opacity-50 pointer-events-none" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${!stripeConnected ? "bg-gray-400" : "bg-blue-600"}`}>
              2
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Importar datos históricos
              </h2>
              <p className="text-sm text-gray-500">
                Importamos los últimos 90 días para calcular tu baseline de recuperación
              </p>
            </div>
          </div>

          {stripeConnected && (
            <button
              onClick={handleImportBaseline}
              disabled={importing}
              className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? "Importando datos..." : "Importar y calcular baseline"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

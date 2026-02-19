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

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  useEffect(() => {
    async function checkStripeConnection() {
      try {
        const res = await fetch("/api/stripe/status");
        const data = await res.json();
        setStripeConnected(data.connected);
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
  }, [success, router]);

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

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            Error al conectar Stripe: {error.replace(/_/g, " ")}
          </div>
        )}

        {/* Step 1: Connect Stripe */}
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
                  : "Conectá tu cuenta para detectar pagos fallidos"}
              </p>
            </div>
          </div>

          {!stripeConnected && (
            <a
              href="/api/stripe/connect"
              className="mt-4 inline-block w-full text-center py-2 px-4 bg-[#635bff] text-white rounded-md hover:bg-[#5046e4] transition-colors"
            >
              Conectar con Stripe
            </a>
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

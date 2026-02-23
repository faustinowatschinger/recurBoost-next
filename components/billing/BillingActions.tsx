"use client";

import { useState } from "react";

interface BillingActionsProps {
  showActivatePlan: boolean;
  showManagePlan: boolean;
}

export function BillingActions({
  showActivatePlan,
  showManagePlan,
}: BillingActionsProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoadingCheckout(true);
    setError("");

    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo iniciar el checkout");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Error de conexión al iniciar checkout");
    } finally {
      setLoadingCheckout(false);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    setError("");

    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo abrir el portal");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Error de conexión al abrir portal");
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
          {error}
        </div>
      )}

      {showActivatePlan && (
        <button
          onClick={handleCheckout}
          disabled={loadingCheckout}
          className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {loadingCheckout ? "Abriendo checkout..." : "Activar plan $49/mes"}
        </button>
      )}

      {showManagePlan && (
        <button
          onClick={handlePortal}
          disabled={loadingPortal}
          className="px-4 py-2 border border-card-border rounded-lg text-foreground hover:bg-card disabled:opacity-60"
        >
          {loadingPortal ? "Abriendo..." : "Gestionar suscripción"}
        </button>
      )}
    </div>
  );
}

"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function RecoveryLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = params.caseId as string;
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdatePayment() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recovery/portal-redirect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, token }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "No pudimos generar el enlace. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError("Error de conexión. Intentá de nuevo en unos segundos.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f6f7fb",
      padding: "16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#fff",
        borderRadius: 16,
        padding: "32px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1f2937",
          margin: "0 0 8px",
        }}>
          Actualizá tu método de pago
        </h1>

        <p style={{
          fontSize: 15,
          color: "#6b7280",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}>
          Tu pago no se pudo procesar. Actualizá tu tarjeta para mantener tu suscripción activa.
        </p>

        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 24,
          textAlign: "left",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#166534" }}>
            Esto es rápido y seguro:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#15803d", lineHeight: 1.8 }}>
            <li>No cambia tu plan actual</li>
            <li>No perdés tu configuración ni datos</li>
            <li>No se te cobra de más</li>
            <li>Se hace en menos de 1 minuto</li>
          </ul>
        </div>

        <button
          onClick={handleUpdatePayment}
          disabled={loading}
          style={{
            display: "block",
            width: "100%",
            padding: "16px 24px",
            background: loading ? "#9ca3af" : "#635bff",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Generando enlace seguro..." : "Actualizar método de pago"}
        </button>

        <p style={{
          marginTop: 12,
          fontSize: 12,
          color: "#9ca3af",
        }}>
          Este enlace es seguro y funciona solo para tu cuenta.
          <br />
          Serás redirigido al portal de pago de Stripe.
        </p>

        {error && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            fontSize: 13,
            color: "#991b1b",
          }}>
            {error}
          </div>
        )}

        <p style={{
          marginTop: 24,
          fontSize: 12,
          color: "#d1d5db",
        }}>
          Si ya no necesitás el servicio, podés ignorar este mensaje.
        </p>
      </div>
    </div>
  );
}

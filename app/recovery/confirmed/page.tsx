"use client";

export default function RecoveryConfirmedPage() {
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1f2937",
          margin: "0 0 12px",
        }}>
          Método de pago actualizado
        </h1>

        <p style={{
          fontSize: 15,
          color: "#6b7280",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}>
          Tu método de pago fue actualizado correctamente.
          Procesaremos tu pago en las próximas horas.
        </p>

        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: "#166534", lineHeight: 1.6 }}>
            No se te va a cobrar de más. Tu suscripción sigue con el mismo plan y precio.
          </p>
        </div>

        <p style={{
          fontSize: 13,
          color: "#9ca3af",
        }}>
          Ya podés cerrar esta ventana.
        </p>
      </div>
    </div>
  );
}

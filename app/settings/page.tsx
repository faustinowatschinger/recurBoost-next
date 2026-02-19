"use client";

import { useEffect, useState } from "react";

interface SettingsData {
  user: {
    email: string;
    companyName: string;
    companyLogo: string;
    senderName: string;
  } | null;
  stripe: {
    connected: boolean;
    stripeAccountId?: string;
    baselineRecoveryRate?: number;
    baselineCalculatedAt?: string;
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

  useEffect(() => {
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
          }
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, companyLogo, senderName }),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalizá los emails de recuperación que reciben tus clientes
        </p>
      </div>

      {/* Company Settings */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personalización de emails</h2>
        <p className="text-sm text-gray-500">
          Esta información aparece en los emails de recuperación enviados a tus clientes.
        </p>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Nombre de la empresa
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tu Empresa S.A."
          />
        </div>

        <div>
          <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
            Nombre del remitente
          </label>
          <input
            id="senderName"
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Equipo de Soporte"
          />
          <p className="mt-1 text-xs text-gray-400">
            Aparece como &quot;De: Nombre &lt;email&gt;&quot; en los emails
          </p>
        </div>

        <div>
          <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700">
            URL del logo
          </label>
          <input
            id="companyLogo"
            type="url"
            value={companyLogo}
            onChange={(e) => setCompanyLogo(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://tu-empresa.com/logo.png"
          />
          <p className="mt-1 text-xs text-gray-400">
            Opcional. Se muestra en el header de los emails de recuperación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Guardado correctamente</span>
          )}
        </div>
      </form>

      {/* Stripe Connection Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Conexión con Stripe</h2>

        {data?.stripe.connected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">Conectado</span>
            </div>
            <p className="text-sm text-gray-500">
              Account ID: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{data.stripe.stripeAccountId}</code>
            </p>
            {data.stripe.baselineRecoveryRate !== undefined && (
              <p className="text-sm text-gray-500">
                Baseline Recovery Rate: <strong>{data.stripe.baselineRecoveryRate}%</strong>
                {data.stripe.baselineCalculatedAt && (
                  <span className="ml-2 text-xs text-gray-400">
                    (calculado {new Date(data.stripe.baselineCalculatedAt).toLocaleDateString("es-AR")})
                  </span>
                )}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">
              No tenés una cuenta de Stripe conectada.
            </p>
            <a
              href="/onboarding"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Ir al onboarding para conectar
            </a>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-2">
        <h2 className="font-semibold text-gray-900">Cuenta</h2>
        <p className="text-sm text-gray-500">
          Email: <strong>{data?.user?.email}</strong>
        </p>
      </div>
    </div>
  );
}

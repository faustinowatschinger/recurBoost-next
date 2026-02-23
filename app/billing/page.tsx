import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  BILLING_PLAN_AMOUNT_USD,
  BILLING_TRIAL_DAYS,
} from "@/lib/billing/config";
import { getBillingAccessState } from "@/lib/billing/service";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BillingActions } from "@/components/billing/BillingActions";

interface BillingPageProps {
  searchParams?:
    | Promise<{
        checkout?: string;
      }>
    | {
        checkout?: string;
      };
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const billing = await getBillingAccessState(session.user.id, {
    autoExpireTrial: true,
  });

  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const checkoutResult = resolvedSearchParams?.checkout;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNav userName={session.user.name || session.user.email || ""} />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-sm text-text-muted mt-1">
            30 días gratis sin tarjeta, luego {formatUsd(BILLING_PLAN_AMOUNT_USD)}
            /mes.
          </p>
        </div>

        {checkoutResult === "success" && (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-sm text-primary">
            Suscripción activada correctamente.
          </div>
        )}
        {checkoutResult === "cancel" && (
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-sm text-warning">
            Checkout cancelado. Podés activarlo cuando quieras.
          </div>
        )}

        <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Estado actual</h2>

          {billing.billingStatus === "trialing" && (
            <div className="space-y-2 text-sm">
              <p>
                Trial activo. Te quedan <strong>{billing.trialDaysLeft}</strong>{" "}
                días.
              </p>
              <p>
                Recuperado durante trial:{" "}
                <strong>{formatUsd(billing.recoveredDuringTrial)}</strong>
              </p>
              <p className="text-text-muted">
                Solo cobramos si al final del trial recuperaste al menos{" "}
                {formatUsd(BILLING_PLAN_AMOUNT_USD)}.
              </p>
            </div>
          )}

          {billing.billingStatus === "active" && (
            <div className="space-y-2 text-sm">
              <p>
                Plan activo: <strong>{formatUsd(BILLING_PLAN_AMOUNT_USD)}/mes</strong>
              </p>
              <p>
                Recuperado durante trial:{" "}
                <strong>{formatUsd(billing.recoveredDuringTrial)}</strong>
              </p>
              <BillingActions showActivatePlan={false} showManagePlan />
            </div>
          )}

          {billing.billingStatus === "canceled" && (
            <div className="space-y-2 text-sm">
              <p>
                Cuenta cancelada por fin de trial. Recuperaste{" "}
                <strong>{formatUsd(billing.recoveredDuringTrial)}</strong> en ese
                período.
              </p>
              {billing.reachedMinimumCharge ? (
                <p>
                  Superaste el mínimo de {formatUsd(BILLING_PLAN_AMOUNT_USD)}. Para
                  seguir usando la app, activá el plan.
                </p>
              ) : (
                <p>
                  No llegaste al mínimo de {formatUsd(BILLING_PLAN_AMOUNT_USD)}.
                  Este mes no corresponde cobro.
                </p>
              )}

              <BillingActions
                showActivatePlan={billing.reachedMinimumCharge}
                showManagePlan={false}
              />
            </div>
          )}

          {billing.billingStatus === "not_started" && (
            <div className="space-y-2 text-sm">
              <p>Aún no inició tu trial porque no conectaste Stripe.</p>
              <a
                href="/onboarding"
                className="inline-block px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                Conectar Stripe
              </a>
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold mb-3">Plan único</h2>
          <ul className="text-sm text-text-muted space-y-2">
            <li>{BILLING_TRIAL_DAYS} días gratis.</li>
            <li>Sin tarjeta durante el trial.</li>
            <li>{formatUsd(BILLING_PLAN_AMOUNT_USD)}/mes al activar.</li>
            <li>
              Solo cobramos si recuperaste al menos{" "}
              {formatUsd(BILLING_PLAN_AMOUNT_USD)} en el período de prueba.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecoveryCaseRow } from "@/components/dashboard/RecoveryCaseRow";
import type { DashboardMetrics, FailureType, RecoveryStatus } from "@/lib/types";

interface CaseData {
  _id: string;
  customerEmail: string;
  amount: number;
  currency: string;
  failureType: FailureType;
  status: RecoveryStatus;
  createdAt: string;
  recovered: boolean;
  currentStep: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const [metricsRes, casesRes] = await Promise.all([
        fetch("/api/dashboard/metrics"),
        fetch("/api/dashboard/cases"),
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }
      if (casesRes.ok) {
        setCases(await casesRes.json());
      }
    } catch {
      // Handle error silently
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // Poll every 30 seconds for new data
    intervalRef.current = setInterval(() => fetchData(), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-foreground">
          No data available
        </h2>
        <p className="mt-2 text-text-muted">
          Connect your Stripe account to start seeing metrics.
        </p>
        <a
          href="/onboarding"
          className="mt-4 inline-block px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          Connect Stripe
        </a>
      </div>
    );
  }

  const liftDollar = Math.round(
    (metrics.liftIncremental / 100) * (metrics.mrrAtRisk + metrics.recoveredThisMonth)
  );

  return (
    <div className="space-y-8">
      {/* Hero Revenue Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-text-muted mb-1">Incremental Revenue Generated</p>
            <p className="text-4xl sm:text-5xl font-bold text-primary">
              ${metrics.recoveredThisMonth.toLocaleString()}
            </p>
            <p className="mt-2 text-text-muted">
              This month you recovered <span className="text-foreground font-medium">${metrics.recoveredThisMonth.toLocaleString()}</span> that would likely have been lost.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 self-start">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-primary font-semibold text-lg">+{metrics.liftIncremental}% lift</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MRR at Risk"
          value={`$${metrics.mrrAtRisk.toLocaleString()}`}
          subtitle="Failed payments pending recovery"
          trend="neutral"
        />
        <MetricCard
          title="Baseline Recovery"
          value={`${metrics.baselineRecoveryRate}%`}
          subtitle="Historical rate (before RecurBoost)"
        />
        <MetricCard
          title="Current Recovery"
          value={`${metrics.currentRecoveryRate}%`}
          subtitle={`+$${liftDollar.toLocaleString()} vs historical recovery`}
          trend={metrics.currentRecoveryRate > metrics.baselineRecoveryRate ? "up" : "neutral"}
        />
        <MetricCard
          title="Avg Recovery Time"
          value={`${metrics.avgRecoveryTime} days`}
          subtitle="From failure to recovery"
        />
      </div>

      {/* Recovery Cases Table */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Recovery Cases</h2>
          <span className="text-xs text-text-muted">{cases.length} cases</span>
        </div>
        {cases.length === 0 ? (
          <div className="px-6 py-12 text-center text-text-muted">
            No recovery cases yet. They&apos;ll appear when Stripe detects failed payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase">Email</th>
                  <th className="text-left py-3 pr-4 text-xs font-medium text-text-muted uppercase">Amount</th>
                  <th className="text-left py-3 pr-4 text-xs font-medium text-text-muted uppercase">Type</th>
                  <th className="text-left py-3 pr-4 text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="text-left py-3 pr-4 text-xs font-medium text-text-muted uppercase">Recovery</th>
                  <th className="text-left py-3 pr-4 text-xs font-medium text-text-muted uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <RecoveryCaseRow key={c._id} {...c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

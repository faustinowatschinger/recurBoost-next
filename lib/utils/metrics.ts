import { connectDB } from "@/lib/db/connection";
import { RecoveryCase, PaymentIntegration, EmailSent, MetricsSnapshot } from "@/lib/db/models";
import type { DashboardMetrics } from "@/lib/types";

export async function calculateMetrics(userId: string): Promise<DashboardMetrics> {
  await connectDB();

  const integration = await PaymentIntegration.findOne({ userId, status: "active" });
  const baselineRecoveryRate = integration?.baselineRecoveryRate ?? 0;

  const allCases = await RecoveryCase.find({ userId });

  const totalFailed = allCases.length;
  const recoveredCases = allCases.filter((c) => c.recovered);
  const totalRecovered = recoveredCases.length;

  // Current recovery rate
  const currentRecoveryRate = totalFailed > 0
    ? (totalRecovered / totalFailed) * 100
    : 0;

  const liftIncremental = currentRecoveryRate - baselineRecoveryRate;

  // MRR at risk
  const activeCases = allCases.filter((c) => c.status === "active");
  const mrrAtRisk = activeCases.reduce((sum, c) => sum + c.amount, 0);

  // Recovered this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const recoveredThisMonth = recoveredCases
    .filter((c) => c.recoveredAt && c.recoveredAt >= startOfMonth)
    .reduce((sum, c) => sum + (c.recoveredAmount || 0), 0);

  // Average recovery time (in days)
  const recoveryTimes = recoveredCases
    .filter((c) => c.recoveredAt)
    .map((c) => {
      const created = new Date(c.createdAt).getTime();
      const recovered = new Date(c.recoveredAt!).getTime();
      return (recovered - created) / (1000 * 60 * 60 * 24);
    });

  const avgRecoveryTime = recoveryTimes.length > 0
    ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
    : 0;

  // ─── Granular metrics ───

  // Get all emails for this user
  const allEmails = await EmailSent.find({ userId });

  // Open rate by email type
  const openRateByType: Record<string, number> = {};
  const ctrByType: Record<string, number> = {};
  const emailTypes = [...new Set(allEmails.map((e) => e.emailType))];

  for (const type of emailTypes) {
    const typeEmails = allEmails.filter((e) => e.emailType === type);
    const totalOfType = typeEmails.length;
    if (totalOfType === 0) continue;

    const opened = typeEmails.filter((e) => e.opened).length;
    const clicked = typeEmails.filter((e) => e.clicked).length;

    openRateByType[type] = Math.round((opened / totalOfType) * 10000) / 100;
    ctrByType[type] = Math.round((clicked / totalOfType) * 10000) / 100;
  }

  // Recovery by step (which step was the last before recovery)
  const recoveryByStep: Record<number, number> = {};
  for (const rc of recoveredCases) {
    const step = rc.currentStep ?? 0;
    recoveryByStep[step] = (recoveryByStep[step] || 0) + 1;
  }

  // Natural vs email-assisted recovery
  const clickedCaseIds = new Set(
    allEmails.filter((e) => e.clicked).map((e) => e.recoveryCaseId.toString())
  );
  let naturalRecoveryCount = 0;
  let emailAssistedRecoveryCount = 0;

  for (const rc of recoveredCases) {
    if (clickedCaseIds.has(rc._id.toString())) {
      emailAssistedRecoveryCount++;
    } else {
      naturalRecoveryCount++;
    }
  }

  // Avg recovery time by failure type
  const avgRecoveryTimeByType: Record<string, number> = {};
  const typeGroups: Record<string, number[]> = {};

  for (const rc of recoveredCases) {
    if (!rc.recoveredAt) continue;
    const days = (new Date(rc.recoveredAt).getTime() - new Date(rc.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const ft = rc.failureType;
    if (!typeGroups[ft]) typeGroups[ft] = [];
    typeGroups[ft].push(days);
  }

  for (const [ft, times] of Object.entries(typeGroups)) {
    avgRecoveryTimeByType[ft] = Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
  }

  const metrics: DashboardMetrics = {
    mrrAtRisk: Math.round(mrrAtRisk * 100) / 100,
    baselineRecoveryRate: Math.round(baselineRecoveryRate * 100) / 100,
    currentRecoveryRate: Math.round(currentRecoveryRate * 100) / 100,
    liftIncremental: Math.round(liftIncremental * 100) / 100,
    recoveredThisMonth: Math.round(recoveredThisMonth * 100) / 100,
    avgRecoveryTime: Math.round(avgRecoveryTime * 10) / 10,
    openRateByType,
    ctrByType,
    recoveryByStep,
    naturalRecoveryCount,
    emailAssistedRecoveryCount,
    avgRecoveryTimeByType,
  };

  return metrics;
}

/**
 * Save a daily metrics snapshot for historical tracking.
 * Call via a daily cron job.
 */
export async function saveMetricsSnapshot(userId: string): Promise<void> {
  const metrics = await calculateMetrics(userId);

  await MetricsSnapshot.create({
    userId,
    mrrAtRisk: metrics.mrrAtRisk,
    recoveryRate: metrics.currentRecoveryRate,
    lift: metrics.liftIncremental,
    recoveredAmount: metrics.recoveredThisMonth,
    totalFailed: 0, // Will be computed from snapshot history
    totalRecovered: 0,
    date: new Date(),
    openRateByType: metrics.openRateByType,
    ctrByType: metrics.ctrByType,
    recoveryByStep: metrics.recoveryByStep,
    naturalRecoveryCount: metrics.naturalRecoveryCount,
    emailAssistedRecoveryCount: metrics.emailAssistedRecoveryCount,
    avgRecoveryTimeByType: metrics.avgRecoveryTimeByType,
  });
}

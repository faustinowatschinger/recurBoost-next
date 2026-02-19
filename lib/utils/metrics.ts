import { connectDB } from "@/lib/db/connection";
import { RecoveryCase, StripeAccount } from "@/lib/db/models";
import type { DashboardMetrics } from "@/lib/types";

export async function calculateMetrics(userId: string): Promise<DashboardMetrics> {
  await connectDB();

  const stripeAccount = await StripeAccount.findOne({ userId });
  const baselineRecoveryRate = stripeAccount?.baselineRecoveryRate || 0;

  // Get all recovery cases for this user
  const allCases = await RecoveryCase.find({ userId });

  const totalFailed = allCases.length;
  const recoveredCases = allCases.filter((c) => c.recovered);
  const totalRecovered = recoveredCases.length;

  // Current recovery rate
  const currentRecoveryRate = totalFailed > 0
    ? (totalRecovered / totalFailed) * 100
    : 0;

  // Lift incremental
  const liftIncremental = currentRecoveryRate - baselineRecoveryRate;

  // MRR at risk = sum of active (not recovered) cases
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

  return {
    mrrAtRisk: Math.round(mrrAtRisk * 100) / 100,
    baselineRecoveryRate: Math.round(baselineRecoveryRate * 100) / 100,
    currentRecoveryRate: Math.round(currentRecoveryRate * 100) / 100,
    liftIncremental: Math.round(liftIncremental * 100) / 100,
    recoveredThisMonth: Math.round(recoveredThisMonth * 100) / 100,
    avgRecoveryTime: Math.round(avgRecoveryTime * 10) / 10,
  };
}

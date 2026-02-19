export type FailureType = "HARD_DECLINE" | "INSUFFICIENT_FUNDS" | "EXPIRED_CARD" | "GENERIC";

export type RecoveryStatus = "active" | "recovered" | "failed" | "cancelled";

export type EmailType = "expired_card" | "insufficient_funds" | "generic";

export type SequenceStep = 0 | 1 | 2;

export interface EmailSequenceConfig {
  type: EmailType;
  steps: {
    day: number;
    subject: string;
    step: SequenceStep;
  }[];
}

export interface DashboardMetrics {
  mrrAtRisk: number;
  baselineRecoveryRate: number;
  currentRecoveryRate: number;
  liftIncremental: number;
  recoveredThisMonth: number;
  avgRecoveryTime: number;
}

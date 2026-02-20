// --- Failure Classification ---

export type FailureType =
  | "HARD_DECLINE_STOLEN"    // stolen_card, lost_card
  | "HARD_DECLINE_FRAUD"     // fraudulent, pickup_card, merchant_blacklist
  | "HARD_DECLINE_BLOCKED"   // restricted_card, security_violation, do_not_try_again, not_permitted
  | "AUTHENTICATION_REQUIRED" // authentication_required (3D Secure)
  | "INSUFFICIENT_FUNDS"     // insufficient_funds, withdrawal_count_limit_exceeded
  | "EXPIRED_CARD"           // expired_card, card_not_supported
  | "DO_NOT_HONOR"           // do_not_honor
  | "INCORRECT_DATA"         // incorrect_number, invalid_cvc, invalid_expiry_*
  | "GENERIC"                // everything else
  | "HARD_DECLINE";          // legacy — backward compat for existing DB records

export type RecoveryStatus = "active" | "recovered" | "failed" | "cancelled";

export type EmailType =
  | "expired_card"
  | "insufficient_funds"
  | "do_not_honor"
  | "authentication_required"
  | "incorrect_data"
  | "generic";

export type SequenceStep = 0 | 1 | 2 | 3 | 4;

export interface SequenceStepConfig {
  day: number;
  step: SequenceStep;
  subject: string;
  preheader: string;
  isFinalWarning?: boolean;
}

export interface EmailSequenceConfig {
  type: EmailType;
  steps: SequenceStepConfig[];
}

export interface DashboardMetrics {
  mrrAtRisk: number;
  baselineRecoveryRate: number;
  currentRecoveryRate: number;
  liftIncremental: number;
  recoveredThisMonth: number;
  avgRecoveryTime: number;
  // Granular metrics
  openRateByType?: Record<string, number>;
  ctrByType?: Record<string, number>;
  recoveryByStep?: Record<number, number>;
  naturalRecoveryCount?: number;
  emailAssistedRecoveryCount?: number;
  avgRecoveryTimeByType?: Record<string, number>;
}

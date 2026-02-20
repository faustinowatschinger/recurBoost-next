"use client";

import type { FailureType, RecoveryStatus } from "@/lib/types";

interface RecoveryCaseRowProps {
  customerEmail: string;
  amount: number;
  currency: string;
  failureType: FailureType;
  status: RecoveryStatus;
  createdAt: string;
  recovered: boolean;
  currentStep: number;
}

const STATUS_LABELS: Record<RecoveryStatus, string> = {
  active: "Active",
  recovered: "Recovered",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<RecoveryStatus, string> = {
  active: "bg-warning/10 text-warning",
  recovered: "bg-primary/10 text-primary",
  failed: "bg-danger/10 text-danger",
  cancelled: "bg-text-muted/10 text-text-muted",
};

const FAILURE_LABELS: Record<FailureType, string> = {
  HARD_DECLINE_STOLEN: "Stolen Card",
  HARD_DECLINE_FRAUD: "Fraud",
  HARD_DECLINE_BLOCKED: "Blocked",
  AUTHENTICATION_REQUIRED: "Auth Required",
  INSUFFICIENT_FUNDS: "Insuff. Funds",
  EXPIRED_CARD: "Expired Card",
  DO_NOT_HONOR: "Do Not Honor",
  INCORRECT_DATA: "Incorrect Data",
  GENERIC: "Generic",
  HARD_DECLINE: "Hard Decline",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function getRecoveryLabel(status: RecoveryStatus, step: number): string {
  if (status === "recovered") {
    return step === 0 ? "After retry" : `After email ${step}`;
  }
  if (status === "failed") {
    return `Failed after ${step + 1} attempts`;
  }
  if (status === "cancelled") {
    return "Cancelled";
  }
  return step === 0 ? "Retry pending" : `Email ${step} sent`;
}

export function RecoveryCaseRow({
  customerEmail,
  amount,
  currency,
  failureType,
  status,
  createdAt,
  currentStep,
}: RecoveryCaseRowProps) {
  return (
    <tr className="border-b border-card-border">
      <td className="py-3 pl-6 pr-4 text-sm text-foreground">{customerEmail}</td>
      <td className="py-3 pr-4 text-sm font-medium text-foreground">
        {formatCurrency(amount, currency)}
      </td>
      <td className="py-3 pr-4">
        <span className="text-xs font-medium text-text-muted">
          {FAILURE_LABELS[failureType]}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs text-text-muted">
        {getRecoveryLabel(status, currentStep)}
      </td>
      <td className="py-3 text-sm text-text-muted">
        {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </td>
    </tr>
  );
}

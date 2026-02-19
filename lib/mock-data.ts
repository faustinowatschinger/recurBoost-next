import type { DashboardMetrics, FailureType, RecoveryStatus } from "@/lib/types";

export const mockMetrics: DashboardMetrics = {
  mrrAtRisk: 1500,
  baselineRecoveryRate: 65,
  currentRecoveryRate: 75.8,
  liftIncremental: 10.8,
  recoveredThisMonth: 480,
  avgRecoveryTime: 3.2,
};

export interface MockCase {
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

const now = Date.now();
const day = 86400000;

export const mockCases: MockCase[] = [
  {
    _id: "mock_1",
    customerEmail: "sarah@acmesaas.com",
    amount: 199,
    currency: "usd",
    failureType: "EXPIRED_CARD",
    status: "recovered",
    createdAt: new Date(now - 2 * day).toISOString(),
    recovered: true,
    currentStep: 1,
  },
  {
    _id: "mock_2",
    customerEmail: "mike@startupco.io",
    amount: 49,
    currency: "usd",
    failureType: "INSUFFICIENT_FUNDS",
    status: "active",
    createdAt: new Date(now - 1 * day).toISOString(),
    recovered: false,
    currentStep: 0,
  },
  {
    _id: "mock_3",
    customerEmail: "alex@devtools.com",
    amount: 99,
    currency: "usd",
    failureType: "GENERIC",
    status: "recovered",
    createdAt: new Date(now - 5 * day).toISOString(),
    recovered: true,
    currentStep: 2,
  },
  {
    _id: "mock_4",
    customerEmail: "jen@cloudapp.co",
    amount: 149,
    currency: "usd",
    failureType: "EXPIRED_CARD",
    status: "active",
    createdAt: new Date(now - 3 * day).toISOString(),
    recovered: false,
    currentStep: 1,
  },
  {
    _id: "mock_5",
    customerEmail: "tom@analyticshq.com",
    amount: 79,
    currency: "usd",
    failureType: "INSUFFICIENT_FUNDS",
    status: "active",
    createdAt: new Date(now - 4 * day).toISOString(),
    recovered: false,
    currentStep: 2,
  },
  {
    _id: "mock_6",
    customerEmail: "lisa@marketingpro.io",
    amount: 29,
    currency: "usd",
    failureType: "GENERIC",
    status: "recovered",
    createdAt: new Date(now - 7 * day).toISOString(),
    recovered: true,
    currentStep: 1,
  },
  {
    _id: "mock_7",
    customerEmail: "dan@crmsuite.com",
    amount: 199,
    currency: "usd",
    failureType: "HARD_DECLINE",
    status: "failed",
    createdAt: new Date(now - 6 * day).toISOString(),
    recovered: false,
    currentStep: 2,
  },
  {
    _id: "mock_8",
    customerEmail: "nina@designlab.co",
    amount: 59,
    currency: "usd",
    failureType: "EXPIRED_CARD",
    status: "active",
    createdAt: new Date(now - 1 * day).toISOString(),
    recovered: false,
    currentStep: 0,
  },
];

export const mockStripeStatus = {
  connected: true,
  baselineCalculated: true,
  stripeAccountId: "acct_mock_123",
};

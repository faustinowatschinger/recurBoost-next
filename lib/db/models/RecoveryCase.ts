import mongoose, { Schema, type Document, type Types } from "mongoose";
import type { FailureType, RecoveryStatus } from "@/lib/types";

export interface IRecoveryCase extends Document {
  userId: Types.ObjectId;
  stripeAccountId: string;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  customerEmail: string;
  amount: number;
  currency: string;
  failureType: FailureType;
  declineCode?: string;
  status: RecoveryStatus;
  recovered: boolean;
  recoveredAmount?: number;
  recoveredAt?: Date;
  portalUrl?: string;
  recoveryToken?: string;
  currentStep: number;
  // Smart retry fields
  smartRetryScheduledFor?: Date;
  smartRetryAttempted: boolean;
  smartRetryResult?: "succeeded" | "failed" | "skipped";
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryCaseSchema = new Schema<IRecoveryCase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeAccountId: { type: String, required: true },
    stripeInvoiceId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    failureType: {
      type: String,
      enum: [
        // New granular types
        "HARD_DECLINE_STOLEN",
        "HARD_DECLINE_FRAUD",
        "HARD_DECLINE_BLOCKED",
        "AUTHENTICATION_REQUIRED",
        "INSUFFICIENT_FUNDS",
        "EXPIRED_CARD",
        "DO_NOT_HONOR",
        "INCORRECT_DATA",
        "GENERIC",
        // Legacy backward compat
        "HARD_DECLINE",
      ],
      required: true,
    },
    declineCode: { type: String },
    status: {
      type: String,
      enum: ["active", "recovered", "failed", "cancelled"],
      default: "active",
    },
    recovered: { type: Boolean, default: false },
    recoveredAmount: { type: Number },
    recoveredAt: { type: Date },
    portalUrl: { type: String },
    recoveryToken: { type: String },
    currentStep: { type: Number, default: 0 },
    // Smart retry
    smartRetryScheduledFor: { type: Date },
    smartRetryAttempted: { type: Boolean, default: false },
    smartRetryResult: { type: String, enum: ["succeeded", "failed", "skipped"] },
  },
  { timestamps: true }
);

export const RecoveryCase =
  mongoose.models.RecoveryCase ||
  mongoose.model<IRecoveryCase>("RecoveryCase", RecoveryCaseSchema);

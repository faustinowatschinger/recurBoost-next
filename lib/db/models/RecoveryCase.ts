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
  currentStep: number;
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
      enum: ["HARD_DECLINE", "INSUFFICIENT_FUNDS", "EXPIRED_CARD", "GENERIC"],
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
    currentStep: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RecoveryCase =
  mongoose.models.RecoveryCase ||
  mongoose.model<IRecoveryCase>("RecoveryCase", RecoveryCaseSchema);

import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  companyName?: string;
  companyLogo?: string;
  senderName?: string;
  brandColor?: string;
  brandButtonColor?: string;
  brandButtonTextColor?: string;
  // Incentive config
  incentiveEnabled?: boolean;
  incentiveText?: string;
  // SMS config (placeholder)
  smsEnabled?: boolean;
  smsThresholdAmount?: number;
  billingStatus?: "trialing" | "active" | "canceled";
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  trialRecoveredAmount?: number;
  trialSummaryEmailSentAt?: Date;
  billingCanceledAt?: Date;
  billingCancellationReason?: string;
  stripeBillingCustomerId?: string;
  stripeBillingSubscriptionId?: string;
  stripeBillingSubscriptionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    companyName: { type: String },
    companyLogo: { type: String },
    senderName: { type: String },
    brandColor: { type: String, default: "#635bff" },
    brandButtonColor: { type: String, default: "#635bff" },
    brandButtonTextColor: { type: String, default: "#ffffff" },
    // Incentive
    incentiveEnabled: { type: Boolean, default: false },
    incentiveText: { type: String },
    // SMS (placeholder)
    smsEnabled: { type: Boolean, default: false },
    smsThresholdAmount: { type: Number },
    billingStatus: {
      type: String,
      enum: ["trialing", "active", "canceled"],
    },
    trialStartedAt: { type: Date },
    trialEndsAt: { type: Date },
    trialRecoveredAmount: { type: Number },
    trialSummaryEmailSentAt: { type: Date },
    billingCanceledAt: { type: Date },
    billingCancellationReason: { type: String },
    stripeBillingCustomerId: { type: String },
    stripeBillingSubscriptionId: { type: String },
    stripeBillingSubscriptionStatus: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

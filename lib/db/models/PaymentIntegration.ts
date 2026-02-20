import mongoose, { Schema, type Document, type Types } from "mongoose";

export type IntegrationMode = "byok" | "connect_oauth";
export type IntegrationStatus = "active" | "invalid" | "disconnected";

export interface IPaymentIntegration extends Document {
  userId: Types.ObjectId;
  provider: "stripe";
  mode: IntegrationMode;
  stripeAccountId: string;
  apiKeyEncrypted: string;
  apiKeyLast4: string;
  webhookSecretEncrypted?: string;
  webhookEndpointId?: string;
  status: IntegrationStatus;
  lastValidationAt?: Date;
  baselineRecoveryRate?: number;
  baselineCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentIntegrationSchema = new Schema<IPaymentIntegration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    provider: {
      type: String,
      enum: ["stripe"],
      default: "stripe",
      required: true,
    },
    mode: {
      type: String,
      enum: ["byok", "connect_oauth"],
      required: true,
    },
    stripeAccountId: { type: String, required: true },
    apiKeyEncrypted: { type: String, required: true },
    apiKeyLast4: { type: String, required: true },
    webhookSecretEncrypted: { type: String },
    webhookEndpointId: { type: String },
    status: {
      type: String,
      enum: ["active", "invalid", "disconnected"],
      default: "active",
      required: true,
    },
    lastValidationAt: { type: Date },
    baselineRecoveryRate: { type: Number },
    baselineCalculatedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentIntegrationSchema.index({ userId: 1, provider: 1 });
PaymentIntegrationSchema.index({ status: 1 });

export const PaymentIntegration =
  mongoose.models.PaymentIntegration ||
  mongoose.model<IPaymentIntegration>(
    "PaymentIntegration",
    PaymentIntegrationSchema
  );

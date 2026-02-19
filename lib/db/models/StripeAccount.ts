import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IStripeAccount extends Document {
  userId: Types.ObjectId;
  stripeAccountId: string;
  accessToken: string;
  refreshToken?: string;
  baselineRecoveryRate?: number;
  baselineCalculatedAt?: Date;
  webhookEndpointId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StripeAccountSchema = new Schema<IStripeAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    stripeAccountId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    baselineRecoveryRate: { type: Number },
    baselineCalculatedAt: { type: Date },
    webhookEndpointId: { type: String },
  },
  { timestamps: true }
);

export const StripeAccount =
  mongoose.models.StripeAccount ||
  mongoose.model<IStripeAccount>("StripeAccount", StripeAccountSchema);

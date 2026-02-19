import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IMetricsSnapshot extends Document {
  userId: Types.ObjectId;
  mrrAtRisk: number;
  recoveryRate: number;
  lift: number;
  recoveredAmount: number;
  totalFailed: number;
  totalRecovered: number;
  date: Date;
}

const MetricsSnapshotSchema = new Schema<IMetricsSnapshot>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mrrAtRisk: { type: Number, default: 0 },
  recoveryRate: { type: Number, default: 0 },
  lift: { type: Number, default: 0 },
  recoveredAmount: { type: Number, default: 0 },
  totalFailed: { type: Number, default: 0 },
  totalRecovered: { type: Number, default: 0 },
  date: { type: Date, default: Date.now, index: true },
});

export const MetricsSnapshot =
  mongoose.models.MetricsSnapshot ||
  mongoose.model<IMetricsSnapshot>("MetricsSnapshot", MetricsSnapshotSchema);

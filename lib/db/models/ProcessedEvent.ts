import mongoose, { Schema, type Document } from "mongoose";

export interface IProcessedEvent extends Document {
  eventId: string;
  processedAt: Date;
}

const ProcessedEventSchema = new Schema<IProcessedEvent>({
  eventId: { type: String, required: true, unique: true },
  processedAt: { type: Date, default: Date.now },
});

// TTL index: auto-delete after 30 days
ProcessedEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const ProcessedEvent =
  mongoose.models.ProcessedEvent ||
  mongoose.model<IProcessedEvent>("ProcessedEvent", ProcessedEventSchema);

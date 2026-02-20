import mongoose, { Schema, type Document, type Types } from "mongoose";
import type { EmailType, SequenceStep } from "@/lib/types";

export interface IEmailSent extends Document {
  recoveryCaseId: Types.ObjectId;
  userId: Types.ObjectId;
  emailType: EmailType;
  step: SequenceStep;
  to: string;
  subject: string;
  resendId?: string;
  sentAt: Date;
  opened: boolean;
  openedAt?: Date;
  clicked: boolean;
  clickedAt?: Date;
}

const EmailSentSchema = new Schema<IEmailSent>({
  recoveryCaseId: { type: Schema.Types.ObjectId, ref: "RecoveryCase", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  emailType: {
    type: String,
    enum: [
      "expired_card",
      "insufficient_funds",
      "do_not_honor",
      "authentication_required",
      "incorrect_data",
      "generic",
    ],
    required: true,
  },
  step: { type: Number, enum: [0, 1, 2, 3, 4], required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  resendId: { type: String },
  sentAt: { type: Date, default: Date.now },
  opened: { type: Boolean, default: false },
  openedAt: { type: Date },
  clicked: { type: Boolean, default: false },
  clickedAt: { type: Date },
});

export const EmailSent =
  mongoose.models.EmailSent || mongoose.model<IEmailSent>("EmailSent", EmailSentSchema);

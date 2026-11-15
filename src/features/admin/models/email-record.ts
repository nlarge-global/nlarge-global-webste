import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type EmailRecordDocument = Document & {
  inquiryId: Types.ObjectId;
  direction: "outbound";
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const emailRecordSchema = new Schema<EmailRecordDocument>({
  inquiryId: { type: Schema.Types.ObjectId, ref: "Inquiry", required: true, index: true },
  direction: { type: String, enum: ["outbound"], required: true },
  recipient: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, required: true, trim: true, maxlength: 150 },
  status: { type: String, enum: ["sent", "failed"], required: true },
  sentAt: { type: Date },
}, { timestamps: true, strict: true });

emailRecordSchema.index({ inquiryId: 1, createdAt: -1 });

export const EmailRecord = getOrCreateModel<EmailRecordDocument>("EmailRecord", emailRecordSchema);

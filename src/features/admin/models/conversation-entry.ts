import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type ConversationEntryDocument = Document & {
  inquiryId: Types.ObjectId;
  channel: "email" | "whatsapp" | "phone" | "meeting" | "internal-note";
  direction: "inbound" | "outbound" | "internal";
  content: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const conversationEntrySchema = new Schema<ConversationEntryDocument>({
  inquiryId: { type: Schema.Types.ObjectId, ref: "Inquiry", required: true, index: true },
  channel: { type: String, enum: ["email", "whatsapp", "phone", "meeting", "internal-note"], required: true },
  direction: { type: String, enum: ["inbound", "outbound", "internal"], required: true },
  content: { type: String, required: true, trim: true, maxlength: 5000 },
  occurredAt: { type: Date, required: true, index: true },
}, { timestamps: true, strict: true });

conversationEntrySchema.index({ inquiryId: 1, occurredAt: -1 });

export const ConversationEntry = getOrCreateModel<ConversationEntryDocument>("ConversationEntry", conversationEntrySchema);

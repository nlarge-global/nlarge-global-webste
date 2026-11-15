import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { addSoftDelete } from "./soft-delete";

export type InquiryDocument = Document & {
  name: string;
  email: string;
  queryType: "general" | "support" | "business" | "careers";
  subject: string;
  message: string;
  consent: true;
  source: "website" | "whatsapp" | "linkedin" | "call" | "friend" | "personal" | "referral" | "other";
  status: "new" | "in-progress" | "converted" | "archived";
  priority: "low" | "normal" | "high";
  tags: string[];
  nextAction?: string;
  followUpAt?: Date;
  clientId?: Types.ObjectId;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
};

const inquirySchema = new Schema<InquiryDocument>({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  queryType: { type: String, enum: ["general", "support", "business", "careers"], required: true },
  subject: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  consent: { type: Boolean, required: true },
  source: { type: String, enum: ["website", "whatsapp", "linkedin", "call", "friend", "personal", "referral", "other"], default: "website" },
  status: { type: String, enum: ["new", "in-progress", "converted", "archived"], default: "new" },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
  tags: { type: [String], default: [] },
  nextAction: { type: String, trim: true, maxlength: 500 },
  followUpAt: { type: Date },
  clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
}, { timestamps: true, strict: true });
addSoftDelete(inquirySchema);

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ email: 1, createdAt: -1 });

export const Inquiry = getOrCreateModel<InquiryDocument>("Inquiry", inquirySchema);

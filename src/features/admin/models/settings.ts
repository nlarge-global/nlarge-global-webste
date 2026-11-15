import { Schema, type Document } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type SettingsDocument = Document & {
  key: "dashboard";
  displayName: string;
  timezone: string;
  dateFormat: string;
  emailSignature: string;
  defaultReplyTemplate: string;
  createdAt: Date;
  updatedAt: Date;
};

const settingsSchema = new Schema<SettingsDocument>({
  key: { type: String, enum: ["dashboard"], unique: true, required: true, default: "dashboard" },
  displayName: { type: String, required: true, maxlength: 100 },
  timezone: { type: String, required: true, maxlength: 100 },
  dateFormat: { type: String, required: true, maxlength: 50 },
  emailSignature: { type: String, required: true, maxlength: 500 },
  defaultReplyTemplate: { type: String, required: true, maxlength: 5000 },
}, { timestamps: true, strict: true });

export const Settings = getOrCreateModel<SettingsDocument>("Settings", settingsSchema);

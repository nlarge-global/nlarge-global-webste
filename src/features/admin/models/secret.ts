import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { addSoftDelete } from "./soft-delete";

export type SecretDocument = Document & {
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  label: string;
  type: "username-password" | "api-key" | "token" | "connection-string" | "environment-file" | "certificate" | "recovery-codes" | "other";
  encryptedValue: string;
  iv: string;
  authTag: string;
  keyVersion: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const secretSchema = new Schema<SecretDocument>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
  label: { type: String, required: true, trim: true, maxlength: 150 },
  type: { type: String, enum: ["username-password", "api-key", "token", "connection-string", "environment-file", "certificate", "recovery-codes", "other"], required: true },
  encryptedValue: { type: String, required: true, select: false },
  iv: { type: String, required: true, select: false },
  authTag: { type: String, required: true, select: false },
  keyVersion: { type: String, required: true, select: false },
  expiresAt: { type: Date },
}, { timestamps: true, strict: true });
addSoftDelete(secretSchema);

secretSchema.index({ clientId: 1, expiresAt: 1 });

export const Secret = getOrCreateModel<SecretDocument>("Secret", secretSchema);

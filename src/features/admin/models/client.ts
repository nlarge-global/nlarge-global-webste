import { Schema, type Document } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type ClientDocument = Document & {
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  notes?: string;
  tags: string[];
  encryptedDataKey?: string;
  dataKeyIv?: string;
  dataKeyAuthTag?: string;
  dataKeyVersion?: string;
  createdAt: Date;
  updatedAt: Date;
};

const clientSchema = new Schema<ClientDocument>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  company: { type: String, trim: true, maxlength: 150 },
  phone: { type: String, trim: true, maxlength: 40 },
  notes: { type: String, trim: true, maxlength: 5000 },
  tags: { type: [String], default: [] },
  encryptedDataKey: { type: String, select: false },
  dataKeyIv: { type: String, select: false },
  dataKeyAuthTag: { type: String, select: false },
  dataKeyVersion: { type: String, select: false },
}, { timestamps: true, strict: true });

clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });

export const Client = getOrCreateModel<ClientDocument>("Client", clientSchema);

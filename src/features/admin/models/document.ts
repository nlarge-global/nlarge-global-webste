import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { addSoftDelete } from "./soft-delete";

export type ClientDocumentRecord = Document<string> & {
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  filename: string;
  description?: string;
  tags: string[];
  objectKey: string;
  contentType: string;
  size: number;
  encrypted?: boolean;
  compression?: "gzip";
  iv?: string;
  authTag?: string;
  keyVersion?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const documentSchema = new Schema<ClientDocumentRecord>({
  _id: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
  filename: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  tags: { type: [String], default: [] },
  objectKey: { type: String, required: true, unique: true },
  contentType: { type: String, required: true, maxlength: 100 },
  size: { type: Number, required: true, max: 25 * 1024 * 1024 },
  encrypted: { type: Boolean, default: false, select: false },
  compression: { type: String, enum: ["gzip"], select: false },
  iv: { type: String, select: false },
  authTag: { type: String, select: false },
  keyVersion: { type: String, select: false },
}, { timestamps: true, strict: true });
addSoftDelete(documentSchema);

documentSchema.index({ clientId: 1, createdAt: -1 });

export const ClientDocument = getOrCreateModel<ClientDocumentRecord>("ClientDocument", documentSchema);

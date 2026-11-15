import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { addSoftDelete } from "./soft-delete";

export type ClientDocumentRecord = Document & {
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  filename: string;
  description?: string;
  objectKey: string;
  contentType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const documentSchema = new Schema<ClientDocumentRecord>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
  filename: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  objectKey: { type: String, required: true, unique: true },
  contentType: { type: String, required: true, maxlength: 100 },
  size: { type: Number, required: true, max: 10 * 1024 * 1024 },
}, { timestamps: true, strict: true });
addSoftDelete(documentSchema);

documentSchema.index({ clientId: 1, createdAt: -1 });

export const ClientDocument = getOrCreateModel<ClientDocumentRecord>("ClientDocument", documentSchema);

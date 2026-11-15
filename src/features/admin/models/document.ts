import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type ClientDocumentRecord = Document & {
  clientId: Types.ObjectId;
  filename: string;
  objectKey: string;
  contentType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
};

const documentSchema = new Schema<ClientDocumentRecord>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  filename: { type: String, required: true, trim: true, maxlength: 200 },
  objectKey: { type: String, required: true, unique: true },
  contentType: { type: String, required: true, maxlength: 100 },
  size: { type: Number, required: true, max: 10 * 1024 * 1024 },
}, { timestamps: true, strict: true });

documentSchema.index({ clientId: 1, createdAt: -1 });

export const ClientDocument = getOrCreateModel<ClientDocumentRecord>("ClientDocument", documentSchema);

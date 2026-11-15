import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type ExportJobDocument = Document & {
  clientId: Types.ObjectId;
  tokenHash: string;
  objectKey: string;
  expiresAt: Date;
  createdAt: Date;
};

const exportJobSchema = new Schema<ExportJobDocument>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  objectKey: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: true });

export const ExportJob = getOrCreateModel<ExportJobDocument>("ExportJob", exportJobSchema);

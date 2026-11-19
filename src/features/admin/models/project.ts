import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { addSoftDelete } from "./soft-delete";

export type ProjectDocument = Document & {
  clientId: Types.ObjectId;
  name: string;
  status: "todo" | "in-progress" | "done";
  technicalDetails?: string;
  deliveryDetails?: string;
  repositoryUrl?: string;
  environment?: string;
  productionUrl?: string;
  stagingUrl?: string;
  deadline?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const projectSchema = new Schema<ProjectDocument>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo", required: true },
  technicalDetails: { type: String, trim: true, maxlength: 5000 },
  deliveryDetails: { type: String, trim: true, maxlength: 5000 },
  repositoryUrl: { type: String, trim: true, maxlength: 500 },
  environment: { type: String, trim: true, maxlength: 100 },
  productionUrl: { type: String, trim: true, maxlength: 500 },
  stagingUrl: { type: String, trim: true, maxlength: 500 },
  deadline: { type: Date },
  deliveredAt: { type: Date },
  notes: { type: String, trim: true, maxlength: 5000 },
}, { timestamps: true, strict: true });
addSoftDelete(projectSchema);

projectSchema.index({ clientId: 1, createdAt: -1 });

export const Project = getOrCreateModel<ProjectDocument>("Project", projectSchema);

import { Schema, type Document } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { addSoftDelete } from "./soft-delete";

export type ProspectStatus =
  | "to-review"
  | "ready-to-contact"
  | "contacted"
  | "responded"
  | "converted"
  | "not-a-fit";

export type ProspectSource =
  | "google-maps"
  | "instagram"
  | "linkedin"
  | "website"
  | "referral"
  | "call"
  | "other";

export type ProspectDocument = Document & {
  name?: string;
  url?: string;
  source: ProspectSource;
  notes?: string;
  status: ProspectStatus;
  nextAction?: string;
  followUpAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const prospectSchema = new Schema<ProspectDocument>({
  name: { type: String, trim: true, maxlength: 150 },
  url: { type: String, trim: true, maxlength: 2048 },
  source: {
    type: String,
    enum: ["google-maps", "instagram", "linkedin", "website", "referral", "call", "other"],
    default: "other",
    required: true,
  },
  notes: { type: String, trim: true, maxlength: 5000 },
  status: {
    type: String,
    enum: ["to-review", "ready-to-contact", "contacted", "responded", "converted", "not-a-fit"],
    default: "to-review",
    required: true,
  },
  nextAction: { type: String, trim: true, maxlength: 500 },
  followUpAt: { type: Date },
}, { timestamps: true, strict: true });

addSoftDelete(prospectSchema);
prospectSchema.index({ status: 1, followUpAt: 1, createdAt: -1 });
prospectSchema.index({ source: 1, createdAt: -1 });
prospectSchema.index({ name: 1 });

export const Prospect = getOrCreateModel<ProspectDocument>("Prospect", prospectSchema);

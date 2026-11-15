import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type ProspectActivityDocument = Document & {
  prospectId: Types.ObjectId;
  type: "note" | "call" | "email" | "message" | "meeting" | "status-change";
  content: string;
  occurredAt: Date;
  createdAt: Date;
};

const prospectActivitySchema = new Schema<ProspectActivityDocument>({
  prospectId: { type: Schema.Types.ObjectId, ref: "Prospect", required: true, index: true },
  type: { type: String, enum: ["note", "call", "email", "message", "meeting", "status-change"], required: true },
  content: { type: String, trim: true, maxlength: 3000, required: true },
  occurredAt: { type: Date, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: true });

prospectActivitySchema.index({ prospectId: 1, occurredAt: -1, _id: -1 });

export const ProspectActivity = getOrCreateModel<ProspectActivityDocument>("ProspectActivity", prospectActivitySchema);

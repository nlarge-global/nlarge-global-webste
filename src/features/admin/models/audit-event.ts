import { Schema, type Document } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type AuditEventDocument = Document & {
  actor: "admin" | "public";
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceLabel?: string;
  requestId: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: Date;
};

const auditEventSchema = new Schema<AuditEventDocument>({
  actor: { type: String, enum: ["admin", "public"], required: true },
  action: { type: String, required: true, maxlength: 100 },
  resourceType: { type: String, required: true, maxlength: 100 },
  resourceId: { type: String, maxlength: 100 },
  resourceLabel: { type: String, maxlength: 200 },
  requestId: { type: String, required: true, maxlength: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: true });

auditEventSchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
auditEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

export const AuditEvent = getOrCreateModel<AuditEventDocument>("AuditEvent", auditEventSchema);

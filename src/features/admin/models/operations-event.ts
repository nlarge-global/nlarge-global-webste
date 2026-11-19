import { Schema, type Document } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";
import {
  operationCategories,
  operationSeverities,
  type OperationCategory,
  type OperationSeverity,
} from "@/features/admin/services/operations-types";

export { operationCategories, operationSeverities };
export type { OperationCategory, OperationSeverity };
export type OperationsEventDocument = Document & {
  category: OperationCategory;
  severity: OperationSeverity;
  event: string;
  source: "server" | "client";
  route: string;
  method: string;
  status?: number;
  resourceType?: string;
  resourceId?: string;
  recordCount?: number;
  message: string;
  errorName?: string;
  stack?: string;
  requestId: string;
  ipAddress: string;
  userAgent: string;
  occurrences: number;
  lastSeenAt: Date;
  groupKey?: string;
  groupBucket?: Date;
  createdAt: Date;
};

const operationsEventSchema = new Schema<OperationsEventDocument>({
  category: { type: String, enum: [...operationCategories, "security"], required: true },
  severity: { type: String, enum: operationSeverities, required: true },
  event: { type: String, required: true, maxlength: 100 },
  source: { type: String, enum: ["server", "client"], required: true },
  route: { type: String, required: true, maxlength: 200 },
  method: { type: String, required: true, maxlength: 10 },
  status: { type: Number, min: 100, max: 599 },
  resourceType: { type: String, maxlength: 100 },
  resourceId: { type: String, maxlength: 100 },
  recordCount: { type: Number, min: 0 },
  message: { type: String, required: true, maxlength: 500 },
  errorName: { type: String, maxlength: 100 },
  stack: { type: String, maxlength: 3000 },
  requestId: { type: String, required: true, maxlength: 100 },
  ipAddress: { type: String, maxlength: 64 },
  userAgent: { type: String, maxlength: 500 },
  occurrences: { type: Number, min: 1, default: 1 },
  lastSeenAt: { type: Date, default: Date.now },
  groupKey: { type: String, maxlength: 64 },
  groupBucket: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: true });

operationsEventSchema.index({ severity: 1, createdAt: -1 });
operationsEventSchema.index({ category: 1, createdAt: -1 });
operationsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 10 });
operationsEventSchema.index(
  { groupKey: 1, groupBucket: 1 },
  { unique: true, partialFilterExpression: { groupKey: { $exists: true } } },
);

export const OperationsEvent = getOrCreateModel<OperationsEventDocument>(
  "OperationsEvent",
  operationsEventSchema,
);

import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type PaymentRecordDocument = Document & {
  clientId: Types.ObjectId;
  amount: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  method: "bank-transfer" | "card" | "cash" | "other";
  status: "pending" | "paid" | "partial" | "overdue" | "cancelled";
  utrReference?: string;
  milestone?: string;
  paidAt?: Date;
  notes?: string;
  proofDocumentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const paymentSchema = new Schema<PaymentRecordDocument>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
  amount: { type: Number, required: true, min: 0.01, max: 1_000_000_000 },
  currency: { type: String, enum: ["INR", "USD", "EUR", "GBP"], required: true },
  method: { type: String, enum: ["bank-transfer", "card", "cash", "other"], required: true },
  status: { type: String, enum: ["pending", "paid", "partial", "overdue", "cancelled"], required: true },
  utrReference: { type: String, trim: true, maxlength: 150 },
  milestone: { type: String, trim: true, maxlength: 150 },
  paidAt: { type: Date },
  notes: { type: String, trim: true, maxlength: 3000 },
  proofDocumentId: { type: Schema.Types.ObjectId, ref: "ClientDocument" },
}, { timestamps: true, strict: true });

paymentSchema.index({ clientId: 1, status: 1, createdAt: -1 });

export const PaymentRecord = getOrCreateModel<PaymentRecordDocument>("PaymentRecord", paymentSchema);

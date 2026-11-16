import { Schema, type Document } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type SubscriberConsentEvent = {
  action: "granted" | "withdrawn";
  version: string;
  text: string;
  occurredAt: Date;
  source: string;
  sourceId?: string;
};

export type SubscriberDocument = Document & {
  email: string;
  unsubscribeKey: string;
  status: "subscribed" | "unsubscribed";
  consentEvents: SubscriberConsentEvent[];
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const consentEventSchema = new Schema<SubscriberConsentEvent>({
  action: { type: String, enum: ["granted", "withdrawn"], required: true },
  version: { type: String, required: true },
  text: { type: String, required: true },
  occurredAt: { type: Date, required: true },
  source: { type: String, required: true },
  sourceId: { type: String },
}, { _id: false });

const subscriberSchema = new Schema<SubscriberDocument>({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true, index: true },
  unsubscribeKey: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["subscribed", "unsubscribed"], required: true },
  consentEvents: { type: [consentEventSchema], default: [] },
  unsubscribedAt: { type: Date },
}, { timestamps: true, strict: true });

subscriberSchema.index({ status: 1, createdAt: -1 });

export const Subscriber = getOrCreateModel<SubscriberDocument>("Subscriber", subscriberSchema);

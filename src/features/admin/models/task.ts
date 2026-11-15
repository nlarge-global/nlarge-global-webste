import { Schema, type Document, type Types } from "mongoose";
import { getOrCreateModel } from "@/lib/mongoose-model";

export type TaskDocument = Document & {
  clientId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  inquiryId?: Types.ObjectId;
  title: string;
  status: "todo" | "in-progress" | "done";
  dueDate?: Date;
  priority: "low" | "normal" | "high";
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const taskSchema = new Schema<TaskDocument>({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
  inquiryId: { type: Schema.Types.ObjectId, ref: "Inquiry", index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo", required: true },
  dueDate: { type: Date },
  priority: { type: String, enum: ["low", "normal", "high"], default: "normal", required: true },
  notes: { type: String, trim: true, maxlength: 3000 },
  completedAt: { type: Date },
}, { timestamps: true, strict: true });

taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ clientId: 1, status: 1, dueDate: 1 });
taskSchema.index({ projectId: 1, status: 1, dueDate: 1 });

export const Task = getOrCreateModel<TaskDocument>("Task", taskSchema);

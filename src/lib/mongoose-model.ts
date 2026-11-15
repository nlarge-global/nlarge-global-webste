import type { Model, Schema } from "mongoose";
import mongoose from "mongoose";

export function getOrCreateModel<T>(
  name: string,
  schema: Schema<T>,
): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

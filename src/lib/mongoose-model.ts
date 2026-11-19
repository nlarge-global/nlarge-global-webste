import type { Model, Schema } from "mongoose";
import mongoose from "mongoose";

export function getOrCreateModel<T>(
  name: string,
  schema: Schema<T>,
): Model<T> {
  const existingModel = mongoose.models[name] as Model<T> | undefined;
  const existingPaths = existingModel && Object.keys(existingModel.schema.paths);
  const schemaPaths = Object.keys(schema.paths);
  const schemaChanged =
    existingPaths &&
    (existingPaths.length !== schemaPaths.length ||
      schemaPaths.some((path) => !existingModel.schema.path(path)));

  if (process.env.NODE_ENV === "development" && schemaChanged) {
    mongoose.deleteModel(name);
  }

  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

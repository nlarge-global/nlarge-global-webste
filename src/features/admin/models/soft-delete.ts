import type { Schema } from "mongoose";

export function addSoftDelete(schema: Schema) {
  schema.add({ deletedAt: { type: Date, index: true } });
  schema.pre("find", function () { this.where({ deletedAt: { $exists: false } }); });
  schema.pre("findOne", function () { this.where({ deletedAt: { $exists: false } }); });
  schema.pre("countDocuments", function () { this.where({ deletedAt: { $exists: false } }); });
}

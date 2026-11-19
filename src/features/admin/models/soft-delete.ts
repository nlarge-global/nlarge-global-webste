import type { Schema } from "mongoose";

export function addSoftDelete(schema: Schema) {
  schema.add({ deletedAt: { type: Date, index: true } });
  schema.pre(["find", "findOne", "countDocuments"], function () {
    const options = this.getOptions();
    if (options.includeDeleted) {
      delete options.includeDeleted;
      return;
    }
    this.where({ deletedAt: { $exists: false } });
  });
}

import assert from "node:assert/strict";
import test from "node:test";
import mongoose, { Schema } from "mongoose";
import { getOrCreateModel } from "../src/lib/mongoose-model.ts";

test("development model reloads include newly added schema fields", () => {
  const modelName = "ProjectLifecycleRegression";
  const originalEnvironment = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = "development";
    mongoose.model(modelName, new Schema({ name: String }));

    const Project = getOrCreateModel(
      modelName,
      new Schema({
        name: String,
        status: { type: String, enum: ["todo", "in-progress", "done"] },
        deadline: Date,
        deliveredAt: Date,
      }),
    );
    const deadline = new Date("2026-10-01");
    const deliveredAt = new Date("2026-10-02");
    const project = new Project({
      name: "Lifecycle",
      status: "done",
      deadline,
      deliveredAt,
    }).toObject();

    assert.equal(project.status, "done");
    assert.equal(project.deadline.getTime(), deadline.getTime());
    assert.equal(project.deliveredAt.getTime(), deliveredAt.getTime());
  } finally {
    mongoose.deleteModel(modelName);
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  }
});

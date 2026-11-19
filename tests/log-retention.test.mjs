import assert from "node:assert/strict";
import test from "node:test";
import { updateLogRetentionIndexes } from "../src/lib/log-retention.ts";

test("updates existing operational and audit TTL indexes to their retention periods", async () => {
  const commands = [];
  const indexes = {
    operationsevents: [{ key: { createdAt: 1 }, expireAfterSeconds: 90 * 24 * 60 * 60 }],
    auditevents: [{ key: { createdAt: -1 } }],
  };
  const db = {
    listCollections: () => ({ hasNext: async () => true }),
    collection: (name) => ({
      indexes: async () => indexes[name],
      createIndex: async () => { throw new Error("unexpected index creation"); },
    }),
    command: async (command) => {
      commands.push(command);
      const collectionIndexes = indexes[command.collMod];
      const target = collectionIndexes.find((index) =>
        JSON.stringify(index.key) === JSON.stringify(command.index.keyPattern),
      );
      target.expireAfterSeconds = command.index.expireAfterSeconds;
    },
  };
  await updateLogRetentionIndexes(db);

  assert.deepEqual(commands.map(({ collMod, index }) => ({
    collection: collMod,
    key: index.keyPattern,
    expireAfterSeconds: index.expireAfterSeconds,
  })), [
    { collection: "operationsevents", key: { createdAt: 1 }, expireAfterSeconds: 10 * 24 * 60 * 60 },
    { collection: "auditevents", key: { createdAt: -1 }, expireAfterSeconds: 30 * 24 * 60 * 60 },
  ]);
});

test("does not issue TTL updates when indexes already match retention", async () => {
  let commandCount = 0;
  const db = {
    listCollections: () => ({ hasNext: async () => true }),
    collection: (name) => ({
      indexes: async () => [{
        key: { createdAt: name === "operationsevents" ? 1 : -1 },
        expireAfterSeconds: name === "operationsevents" ? 10 * 24 * 60 * 60 : 30 * 24 * 60 * 60,
      }],
      createIndex: async () => { throw new Error("unexpected index creation"); },
    }),
    command: async () => { commandCount += 1; },
  };
  await updateLogRetentionIndexes(db);

  assert.equal(commandCount, 0);
});

test("creates missing TTL indexes", async () => {
  const created = [];
  await updateLogRetentionIndexes({
    listCollections: () => ({ hasNext: async () => false }),
    collection: (name) => ({
      indexes: async () => [],
      createIndex: async (key, options) => created.push({ name, key, options }),
    }),
    command: async () => { throw new Error("unexpected index update"); },
  });

  assert.deepEqual(created, [
    { name: "operationsevents", key: { createdAt: 1 }, options: { expireAfterSeconds: 864000 } },
    { name: "auditevents", key: { createdAt: -1 }, options: { expireAfterSeconds: 2592000 } },
  ]);
});

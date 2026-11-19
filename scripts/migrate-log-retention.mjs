import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { updateLogRetentionIndexes } from "../src/lib/log-retention.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");

function loadEnvFile(filename) {
  const file = path.resolve(projectRoot, filename);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is required.");
if (process.env.APPLY_LOG_RETENTION !== "YES") {
  throw new Error("Set APPLY_LOG_RETENTION=YES to confirm log retention will be applied.");
}
const databaseName = decodeURIComponent(new URL(mongoUri).pathname.replace(/^\/+/, ""));
if (!databaseName || process.env.LOG_RETENTION_DATABASE !== databaseName) {
  throw new Error("Set LOG_RETENTION_DATABASE to exactly match the database in MONGODB_URI.");
}

await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5_000 });
try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB database handle is unavailable after connecting.");
  await updateLogRetentionIndexes(db);
  console.log(`Configured 10-day operational and 30-day audit log retention for "${databaseName}".`);
} finally {
  await mongoose.disconnect();
}

import mongoose from "mongoose";
import { getMongoUri } from "@/lib/env";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __nlargeMongoose?: MongooseCache;
};

const cache = globalWithMongoose.__nlargeMongoose ?? {
  connection: null,
  promise: null,
};

globalWithMongoose.__nlargeMongoose = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;
  if (!cache.promise) {
    cache.promise = (async () => {
      return mongoose.connect(getMongoUri(), {
        serverSelectionTimeoutMS: 5_000,
        maxPoolSize: 10,
      });
    })().catch((error) => {
      cache.promise = null;
      throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : "unknown error"}`);
    });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}

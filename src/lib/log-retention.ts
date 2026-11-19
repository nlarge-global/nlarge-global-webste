type LogIndexDescription = {
  key: Record<string, unknown>;
  expireAfterSeconds?: number;
};

type RetentionDatabase = {
  listCollections(filter: { name: string }, options: { nameOnly: true }): {
    hasNext(): Promise<boolean | null>;
  };
  collection(name: string): {
    indexes(): Promise<LogIndexDescription[]>;
    createIndex(
      key: Record<string, number>,
      options: { expireAfterSeconds: number },
    ): Promise<unknown>;
  };
  command(command: {
    collMod: string;
    index: {
      keyPattern: Record<string, number>;
      expireAfterSeconds: number;
    };
  }): Promise<unknown>;
};

const retentionIndexes = [
  { collection: "operationsevents", field: "createdAt", direction: 1, expireAfterSeconds: 10 * 24 * 60 * 60 },
  { collection: "auditevents", field: "createdAt", direction: -1, expireAfterSeconds: 30 * 24 * 60 * 60 },
] as const;

export async function updateLogRetentionIndexes(db: RetentionDatabase) {
  for (const index of retentionIndexes) {
    const collection = db.collection(index.collection);
    const keyPattern = { [index.field]: index.direction };
    if (!await db.listCollections({ name: index.collection }, { nameOnly: true }).hasNext()) {
      await collection.createIndex(keyPattern, { expireAfterSeconds: index.expireAfterSeconds });
      continue;
    }

    const indexes = await collection.indexes();
    const existing = indexes.find((candidate) =>
      Object.keys(candidate.key).length === 1
      && candidate.key[index.field] === index.direction,
    );
    if (!existing) {
      await collection.createIndex(keyPattern, { expireAfterSeconds: index.expireAfterSeconds });
      continue;
    }
    if (existing.expireAfterSeconds === index.expireAfterSeconds) continue;

    await db.command({
      collMod: index.collection,
      index: {
        keyPattern,
        expireAfterSeconds: index.expireAfterSeconds,
      },
    });
  }
}

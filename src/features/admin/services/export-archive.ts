import { randomBytes } from "node:crypto";
import { ZipWriter } from "@zip.js/zip.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ExportType =
  | "client"
  | "prospects"
  | "subscribers"
  | "inquiries"
  | "audit"
  | "operations";

export function generateExportPassword() {
  return randomBytes(24).toString("base64url");
}

export function parseExportDateRange(
  from: string,
  to: string,
  maxDays: number,
) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== from ||
    end.toISOString().slice(0, 10) !== to ||
    end < start
  ) {
    return null;
  }

  const endExclusive = new Date(end.getTime() + DAY_MS);
  if ((endExclusive.getTime() - start.getTime()) / DAY_MS > maxDays) {
    return null;
  }

  return { $gte: start, $lt: endExclusive };
}

export function createEncryptedZipStream(password: string) {
  let streamController: TransformStreamDefaultController<Uint8Array>;
  const stream = new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      streamController = controller;
    },
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
  const writer = new ZipWriter(stream.writable, {
    password,
    encryptionStrength: 3,
    level: 6,
    keepOrder: true,
  });

  return {
    readable: stream.readable,
    add: writer.add.bind(writer),
    close: writer.close.bind(writer),
    fail(error: unknown) {
      streamController.error(error);
    },
  };
}

import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import {
  decryptDocumentBytes,
  encryptDocumentBytes,
} from "@/features/admin/auth/document-crypto";
import type { ClientDocumentRecord } from "@/features/admin/models/document";
import { compressDocumentContent } from "@/features/admin/services/document-compression";
import { downloadPrivateObject } from "@/lib/r2";

const gunzipAsync = promisify(gunzip);

export async function prepareDocumentContent(
  content: Uint8Array,
  contentType: string,
  key: Buffer,
) {
  const { content: storedContent, compression } =
    await compressDocumentContent(content);
  const encrypted = encryptDocumentBytes(storedContent, key);
  return { ...encrypted, compression };
}

export async function readDocumentContent(
  document: Pick<
    ClientDocumentRecord,
    | "objectKey"
    | "encrypted"
    | "compression"
    | "iv"
    | "authTag"
  >,
  key?: Buffer,
) {
  let content: Uint8Array = await downloadPrivateObject(document.objectKey);
  if (document.encrypted) {
    if (!key || !document.iv || !document.authTag) {
      throw new Error("Document encryption metadata is incomplete.");
    }
    content = decryptDocumentBytes(
      content,
      { iv: document.iv, authTag: document.authTag },
      key,
    );
  }
  if (document.compression === "gzip") content = await gunzipAsync(content);
  return Buffer.from(content);
}

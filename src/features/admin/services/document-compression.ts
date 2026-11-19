import { gzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);

export async function compressDocumentContent(content: Uint8Array) {
  const compressed = await gzipAsync(content);
  return compressed.length < content.length
    ? { content: compressed, compression: "gzip" as const }
    : { content, compression: undefined };
}

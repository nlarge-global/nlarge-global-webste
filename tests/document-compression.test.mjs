import assert from "node:assert/strict";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { compressDocumentContent } from "../src/features/admin/services/document-compression.ts";

test("document compression keeps gzip only when it reduces stored bytes", async () => {
  const repetitive = Buffer.from("project evidence\n".repeat(200));
  const compact = await compressDocumentContent(repetitive);
  assert.equal(compact.compression, "gzip");
  assert.deepEqual(gunzipSync(compact.content), repetitive);

  const noisy = Uint8Array.from({ length: 256 }, (_, index) => index);
  const unchanged = await compressDocumentContent(noisy);
  assert.equal(unchanged.compression, undefined);
  assert.equal(unchanged.content, noisy);
});

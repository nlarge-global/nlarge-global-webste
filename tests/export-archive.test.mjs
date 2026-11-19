import assert from "node:assert/strict";
import test from "node:test";
import {
  BlobReader,
  TextWriter,
  ZipReader,
} from "@zip.js/zip.js";
import {
  createEncryptedZipStream,
  generateExportPassword,
  parseExportDateRange,
} from "../src/features/admin/services/export-archive.ts";

test("export password is high entropy and safe to share as text", () => {
  const password = generateExportPassword();
  assert.match(password, /^[A-Za-z0-9_-]{32}$/);
  assert.notEqual(password, generateExportPassword());
});

test("export date ranges are inclusive, valid, and bounded", () => {
  assert.deepEqual(parseExportDateRange("2026-01-01", "2026-01-03", 3), {
    $gte: new Date("2026-01-01T00:00:00.000Z"),
    $lt: new Date("2026-01-04T00:00:00.000Z"),
  });
  assert.equal(parseExportDateRange("2026-01-03", "2026-01-01", 3), null);
  assert.equal(parseExportDateRange("2026-02-30", "2026-03-01", 3), null);
  assert.equal(parseExportDateRange("2026-01-01", "2026-01-04", 3), null);
});

test("AES-256 encrypted export opens with its password only", async () => {
  const password = generateExportPassword();
  const archive = createEncryptedZipStream(password);
  const bytesPromise = new Response(archive.readable).arrayBuffer();

  await archive.add("hello.txt", new Blob(["hello"]).stream());
  await archive.close();

  const bytes = await bytesPromise;
  const reader = new ZipReader(new BlobReader(new Blob([bytes])), { password });
  const [entry] = await reader.getEntries();
  assert.equal(await entry.getData(new TextWriter()), "hello");
  await reader.close();

  const wrongPasswordReader = new ZipReader(
    new BlobReader(new Blob([bytes])),
    { password: `${password}wrong` },
  );
  const [wrongPasswordEntry] = await wrongPasswordReader.getEntries();
  await assert.rejects(wrongPasswordEntry.getData(new TextWriter()));
  await wrongPasswordReader.close().catch(() => undefined);
});

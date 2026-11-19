import assert from "node:assert/strict";
import test from "node:test";
import {
  documentUploadConfig,
  getDocumentType,
} from "../src/features/admin/services/document-upload-config.ts";

test("supported document types are recognized by MIME type and extension", () => {
  assert.equal(getDocumentType({ name: "brief.pdf", type: "application/pdf" }), "application/pdf");
  assert.equal(getDocumentType({ name: "diagram.PNG", type: "" }), "image/png");
  assert.equal(getDocumentType({ name: "archive.zip", type: "application/octet-stream" }), "application/zip");
  assert.equal(getDocumentType({ name: "notes.txt", type: "text/plain" }), "text/plain");
  assert.equal(getDocumentType({ name: "program.exe", type: "application/octet-stream" }), null);
});

test("upload limits are configured per supported type", () => {
  assert.equal(documentUploadConfig["application/pdf"].maxSize, 10 * 1024 * 1024);
  assert.equal(documentUploadConfig["image/png"].maxSize, 5 * 1024 * 1024);
  assert.equal(documentUploadConfig["application/zip"].maxSize, 25 * 1024 * 1024);
  assert.equal(documentUploadConfig["text/plain"].maxSize, 1024 * 1024);
});

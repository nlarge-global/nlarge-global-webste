import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptDocumentBytes,
  encryptDocumentBytes,
} from "../src/features/admin/auth/document-crypto.ts";

test("document encryption round-trips bytes with a client data key", () => {
  const key = Buffer.alloc(32, 7);
  const plaintext = Buffer.from([0, 1, 2, 255, 13, 10]);
  const encrypted = encryptDocumentBytes(plaintext, key);

  assert.notDeepEqual(encrypted.ciphertext, plaintext);
  assert.deepEqual(
    decryptDocumentBytes(encrypted.ciphertext, encrypted, key),
    plaintext,
  );
});

test("document encryption rejects tampered content", () => {
  const encrypted = encryptDocumentBytes(Buffer.from("private file"), Buffer.alloc(32, 3));
  const tampered = Buffer.from(encrypted.ciphertext);
  tampered[0] ^= 1;

  assert.throws(() =>
    decryptDocumentBytes(tampered, encrypted, Buffer.alloc(32, 3)),
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeOperationsText } from "../src/features/admin/services/operations-redaction.ts";

test("operations logs redact credentials, database URIs, and email addresses", () => {
  const sanitized = sanitizeOperationsText(
    "password=hunter2 token:abc123 MongoDB://user:pass@db.example/app jane@example.com",
  );
  assert.doesNotMatch(sanitized, /hunter2|abc123|user:pass|jane@example\.com/);
  assert.match(sanitized, /\[redacted database URI\]/);
  assert.match(sanitized, /\[redacted email\]/);
});

test("operations log text is bounded and strips control characters", () => {
  assert.equal(sanitizeOperationsText("a".repeat(4000)).length, 3000);
  assert.equal(sanitizeOperationsText("error\u0000message"), "error message");
});

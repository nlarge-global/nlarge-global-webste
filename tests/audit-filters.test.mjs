import assert from "node:assert/strict";
import test from "node:test";
import {
  escapeAuditSearch,
  parseAuditDate,
} from "../src/features/admin/services/audit-filters.ts";

test("audit date filters reject invalid dates and support inclusive day boundaries", () => {
  assert.equal(parseAuditDate("2026-02-31"), undefined);
  assert.equal(parseAuditDate("not-a-date"), undefined);
  assert.equal(parseAuditDate(undefined), undefined);
  assert.equal(parseAuditDate("2026-02-28")?.toISOString(), "2026-02-28T00:00:00.000Z");
  assert.equal(
    parseAuditDate("2026-02-28", true)?.toISOString(),
    "2026-02-28T23:59:59.999Z",
  );
});

test("audit search text is treated literally in a regular expression", () => {
  const expression = new RegExp(escapeAuditSearch("project[1]"), "i");
  assert.equal(expression.test("Project[1]"), true);
  assert.equal(expression.test("project1"), false);
});

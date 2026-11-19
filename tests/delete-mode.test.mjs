import assert from "node:assert/strict";
import test from "node:test";
import { getDeleteMode } from "../src/features/admin/services/delete-mode.ts";

test("delete requests default to soft delete and accept permanent delete explicitly", () => {
  assert.equal(getDeleteMode(new Request("https://example.test/api/admin/tasks")), "soft");
  assert.equal(getDeleteMode(new Request("https://example.test/api/admin/tasks?mode=soft")), "soft");
  assert.equal(getDeleteMode(new Request("https://example.test/api/admin/tasks?mode=permanent")), "permanent");
  assert.equal(getDeleteMode(new Request("https://example.test/api/admin/tasks?mode=unknown")), null);
});

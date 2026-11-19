import assert from "node:assert/strict";
import test from "node:test";
import {
  getArchiveQuery,
  includesArchived,
  parseArchiveFilter,
} from "../src/features/admin/services/archive-filter.ts";

test("archive filter defaults invalid and missing values to active records", () => {
  assert.equal(parseArchiveFilter(undefined), "active");
  assert.equal(parseArchiveFilter("invalid"), "active");
  assert.deepEqual(getArchiveQuery(parseArchiveFilter(null)), {
    deletedAt: { $exists: false },
  });
  assert.equal(includesArchived("active"), false);
});

test("archive filter selects archived records or leaves both states available", () => {
  assert.deepEqual(getArchiveQuery(parseArchiveFilter("archived")), {
    deletedAt: { $exists: true },
  });
  assert.deepEqual(getArchiveQuery(parseArchiveFilter("all")), {});
  assert.equal(includesArchived("archived"), true);
  assert.equal(includesArchived("all"), true);
});

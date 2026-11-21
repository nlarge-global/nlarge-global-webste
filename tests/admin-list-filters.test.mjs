import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveFilters,
  getClearFiltersHref,
  getQueryFormHref,
} from "../src/features/admin/services/admin-list-filters.ts";

test("active filters omit each field's default option", () => {
  const fields = [
    {
      name: "archive",
      label: "Records",
      value: "archived",
      options: [
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
      ],
    },
    {
      name: "type",
      label: "Secret type",
      value: "",
      options: [{ value: "", label: "All types" }],
    },
  ];

  assert.deepEqual(getActiveFilters(fields), [fields[0]]);
});

test("clear filters preserves unrelated query values and resets pagination", () => {
  assert.equal(
    getClearFiltersHref(
      "/admin/clients/abc",
      "archive=archived&type=api-key&page=3&tab=projects",
      ["archive", "type"],
    ),
    "/admin/clients/abc?tab=projects",
  );
});

test("query forms build an encoded client-navigation URL without empty filters", () => {
  assert.equal(
    getQueryFormHref("/admin/prospects", [
      ["q", "Acme & Co"],
      ["status", ""],
      ["archive", "all"],
    ]),
    "/admin/prospects?q=Acme+%26+Co&archive=all",
  );
});

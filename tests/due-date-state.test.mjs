import assert from "node:assert/strict";
import test from "node:test";
import { getDueDateState } from "../src/features/admin/services/due-date-state.ts";
import {
  formatDateTime,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "../src/features/admin/services/date-time.ts";

const today = new Date(2026, 10, 18, 12);

test("due date state distinguishes past, today, soon, and later dates", () => {
  assert.equal(getDueDateState("2026-11-17", today), "overdue");
  assert.equal(getDueDateState("2026-11-18", today), "today");
  assert.equal(getDueDateState("2026-11-21", today), "soon");
  assert.equal(getDueDateState("2026-11-22", today), "later");
});

test("missing and invalid due dates have no urgency state", () => {
  assert.equal(getDueDateState(null, today), null);
  assert.equal(getDueDateState("not-a-date", today), null);
  assert.equal(getDueDateState("2026-02-31", today), null);
  assert.equal(getDueDateState(new Date(Number.NaN), today), null);
});

test("date-time due dates become overdue at their exact time", () => {
  assert.equal(getDueDateState("2026-11-18T11:59:00", today), "overdue");
  assert.equal(getDueDateState("2026-11-18T12:01:00", today), "today");
});

test("local date-time input round-trips the same instant", () => {
  const date = new Date(2026, 10, 18, 19, 38);
  const input = toDateTimeLocal(date);
  assert.equal(input, "2026-11-18T19:38");
  assert.equal(fromDateTimeLocal(input), date.toISOString());
  assert.equal(formatDateTime(date), date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }));
});

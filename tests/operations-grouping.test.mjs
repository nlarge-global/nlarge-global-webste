import assert from "node:assert/strict";
import test from "node:test";
import {
  getOperationsGroupBucket,
  getOperationsGroupKey,
  shouldGroupOperationsEvent,
} from "../src/features/admin/services/operations-grouping.ts";

const event = {
  category: "application",
  severity: "medium",
  event: "client.api_error",
  source: "client",
  route: "/api/admin/projects",
  method: "GET",
  status: 500,
  resourceType: "project",
  resourceId: "project-1",
  message: "Request failed",
  errorName: "Error",
  ipAddress: "192.0.2.1",
  userAgent: "test-agent",
};

test("groups identical failures and keeps security sources distinct", () => {
  assert.equal(getOperationsGroupKey(event), getOperationsGroupKey({ ...event }));
  assert.equal(
    getOperationsGroupKey({ ...event, category: "security" }),
    getOperationsGroupKey({ ...event, category: "security" }),
  );
  assert.notEqual(
    getOperationsGroupKey({ ...event, category: "security", ipAddress: "192.0.2.1" }),
    getOperationsGroupKey({ ...event, category: "security", ipAddress: "192.0.2.2" }),
  );
  assert.notEqual(
    getOperationsGroupKey(event),
    getOperationsGroupKey({ ...event, message: "Different failure" }),
  );
  assert.notEqual(
    getOperationsGroupKey(event),
    getOperationsGroupKey({ ...event, resourceId: "project-2" }),
  );
});

test("groups within fixed 15-minute buckets and leaves successful actions ungrouped", () => {
  const first = new Date("2026-11-18T10:01:00.000Z");
  const sameBucket = new Date("2026-11-18T10:14:59.999Z");
  const nextBucket = new Date("2026-11-18T10:15:00.000Z");
  assert.equal(getOperationsGroupBucket(first).getTime(), getOperationsGroupBucket(sameBucket).getTime());
  assert.notEqual(getOperationsGroupBucket(first).getTime(), getOperationsGroupBucket(nextBucket).getTime());

  assert.equal(shouldGroupOperationsEvent("application", "server", 500), true);
  assert.equal(shouldGroupOperationsEvent("application", "client"), true);
  assert.equal(shouldGroupOperationsEvent("data-access", "server", 200), false);
  assert.equal(shouldGroupOperationsEvent("security", "server", 200), false);
  assert.equal(shouldGroupOperationsEvent("security", "server", 401), true);
});

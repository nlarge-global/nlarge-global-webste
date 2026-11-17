import assert from "node:assert/strict";
import test from "node:test";
import {
  isRateLimitExceeded,
  RATE_LIMITS,
} from "../src/lib/rate-limit-config.ts";

test("global API limit allows 300 requests and blocks the next", () => {
  const { maxRequests } = RATE_LIMITS.globalApi;
  assert.equal(isRateLimitExceeded(maxRequests, maxRequests), false);
  assert.equal(isRateLimitExceeded(maxRequests + 1, maxRequests), true);
});

test("admin login allows 10 attempts per IP and blocks the next", () => {
  const { maxRequests } = RATE_LIMITS.adminLogin;
  assert.equal(maxRequests, 10);
  assert.equal(isRateLimitExceeded(maxRequests, maxRequests), false);
  assert.equal(isRateLimitExceeded(maxRequests + 1, maxRequests), true);
});

test("contact and unsubscribe retain their specific limits", () => {
  for (const limit of [RATE_LIMITS.contact, RATE_LIMITS.unsubscribeRequest]) {
    assert.equal(limit.maxRequests, 5);
    assert.equal(isRateLimitExceeded(limit.maxRequests, limit.maxRequests), false);
    assert.equal(isRateLimitExceeded(limit.maxRequests + 1, limit.maxRequests), true);
  }
});

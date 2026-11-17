import { getServerEnv } from "./env";
import { isRateLimitExceeded, RATE_LIMITS } from "./rate-limit-config";

type RateLimitScope = keyof typeof RATE_LIMITS;
export { RATE_LIMITS } from "./rate-limit-config";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function isRateLimited(scope: RateLimitScope, identifier: string) {
  const { keyPrefix, maxRequests, windowMs } = RATE_LIMITS[scope];
  const key = `${keyPrefix}:${identifier}`;
  const env = getServerEnv();

  if (Boolean(env.UPSTASH_REDIS_REST_URL) !== Boolean(env.UPSTASH_REDIS_REST_TOKEN)) {
    throw new Error("Both Upstash Redis REST credentials must be configured.");
  }

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, Math.ceil(windowMs / 1000)],
      ]),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Upstash rate-limit request failed with status ${response.status}.`);
    }

    const results: unknown = await response.json();
    if (
      !Array.isArray(results)
      || typeof results[0]?.result !== "number"
      || results[1]?.result !== 1
    ) {
      throw new Error("Upstash returned an invalid rate-limit response.");
    }

    return isRateLimitExceeded(results[0].result, maxRequests);
  }

  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (isRateLimitExceeded(current.count + 1, maxRequests)) return true;
  current.count += 1;
  return false;
}

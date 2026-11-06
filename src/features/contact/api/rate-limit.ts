import { getServerEnv } from "@/lib/env";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

export async function isContactRateLimited(ip: string) {
  const env = getServerEnv();

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const key = `contact-rate:${ip}`;
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, Math.ceil(RATE_LIMIT_WINDOW / 1000)],
      ]),
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Rate limit service unavailable");
    const results = await response.json() as Array<{ result: number }>;
    return Number(results[0]?.result) > RATE_LIMIT_MAX_REQUESTS;
  }

  const now = Date.now();
  const limit = rateLimitStore.get(ip);
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  limit.count += 1;
  return false;
}

export const HEALTH_CHECK_NAMES = [
  "environment",
  "mongodb",
  "smtp",
  "r2",
  "upstash",
] as const;

export type HealthCheckName = (typeof HEALTH_CHECK_NAMES)[number];
export type HealthCheck = {
  status: "ok" | "not-configured" | "error";
  message: string;
  details?: string;
};

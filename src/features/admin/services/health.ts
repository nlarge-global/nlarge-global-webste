import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyPrivateStorage } from "@/lib/r2";
import { verifyDashboardEmail } from "@/features/contact/services/email";
import { HEALTH_CHECK_NAMES, type HealthCheck, type HealthCheckName } from "./health-types";

export { HEALTH_CHECK_NAMES, type HealthCheck, type HealthCheckName } from "./health-types";

function getErrorDetails(error: unknown, secrets: string[]) {
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of secrets) message = message.replaceAll(secret, "[REDACTED]");
  return message || "Unknown error.";
}

function publicCheck(check: HealthCheck): HealthCheck {
  if (process.env.NODE_ENV !== "development") delete check.details;
  return check;
}

export async function getHealthCheck(name: HealthCheckName): Promise<HealthCheck> {
  const env = getServerEnv();
  const secrets = [
    env.MONGODB_URI,
    env.SMTP_USER,
    env.SMTP_PASS,
    env.R2_ACCESS_KEY_ID,
    env.R2_SECRET_ACCESS_KEY,
    env.UPSTASH_REDIS_REST_URL,
    env.UPSTASH_REDIS_REST_TOKEN,
  ].filter((secret): secret is string => Boolean(secret));
  const errorDetails = (error: unknown) => getErrorDetails(error, secrets);

  if (name === "environment") {
    return publicCheck({ status: "ok", message: "Required server configuration is readable." });
  }

  if (name === "mongodb") {
    if (!env.MONGODB_URI) return { status: "not-configured", message: "MongoDB is not configured." };
    try {
      await connectToDatabase();
      return publicCheck(mongoose.connection.readyState === 1
        ? { status: "ok", message: "MongoDB connection is available." }
        : {
            status: "error",
            message: "MongoDB connection is not ready.",
            details: `Connection ready state: ${mongoose.connection.readyState}.`,
          });
    } catch (error) {
      return publicCheck({ status: "error", message: "MongoDB connection failed.", details: errorDetails(error) });
    }
  }

  if (name === "smtp") {
    if (!env.SMTP_USER && !env.SMTP_PASS) return { status: "not-configured", message: "SMTP is not configured." };
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      return publicCheck({
        status: "error",
        message: "SMTP configuration is incomplete.",
        details: `Missing ${!env.SMTP_USER ? "SMTP_USER" : "SMTP_PASS"}.`,
      });
    }
    try {
      await verifyDashboardEmail();
      return { status: "ok", message: "SMTP connection is available for dashboard replies." };
    } catch (error) {
      return publicCheck({ status: "error", message: "SMTP connection failed.", details: errorDetails(error) });
    }
  }

  if (name === "r2") {
    const configuration = {
      R2_ENDPOINT: env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME: env.R2_BUCKET_NAME,
    };
    if (!Object.values(configuration).some(Boolean)) {
      return { status: "not-configured", message: "Private storage is not configured." };
    }
    const missing = Object.entries(configuration)
      .filter(([, value]) => !value)
      .map(([key]) => key);
    if (missing.length) {
      return publicCheck({
        status: "error",
        message: "Private storage configuration is incomplete.",
        details: `Missing ${missing.join(", ")}.`,
      });
    }
    try {
      await verifyPrivateStorage();
      return { status: "ok", message: "Private storage is available." };
    } catch (error) {
      const metadata = error && typeof error === "object" && "$metadata" in error
        ? error.$metadata
        : undefined;
      const status = metadata && typeof metadata === "object" && "httpStatusCode" in metadata
        ? metadata.httpStatusCode
        : undefined;
      return publicCheck({
        status: "error",
        message: status === 403
          ? "R2 rejected the request. Check the API token permissions, bucket scope, bucket name, and account endpoint."
          : "Private storage check failed. Verify the R2 endpoint, bucket name, and credentials.",
        details: errorDetails(error),
      });
    }
  }

  if (!env.UPSTASH_REDIS_REST_URL && !env.UPSTASH_REDIS_REST_TOKEN) {
    return { status: "not-configured", message: "Upstash Redis is not configured." };
  }
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return publicCheck({
      status: "error",
      message: "Upstash Redis configuration is incomplete.",
      details: `Missing ${!env.UPSTASH_REDIS_REST_URL ? "UPSTASH_REDIS_REST_URL" : "UPSTASH_REDIS_REST_TOKEN"}.`,
    });
  }
  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/ping`, {
      headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      const body = await response.text();
      let details = body || `HTTP ${response.status} ${response.statusText}`;
      try {
        const result: { error?: unknown } = JSON.parse(body);
        if (typeof result.error === "string") details = result.error;
      } catch {
        // Keep the raw response when it is not JSON.
      }
      return publicCheck({
        status: "error",
        message: "Upstash Redis health check failed. Verify the REST URL and token.",
        details: errorDetails(details),
      });
    }
    const result: { result?: unknown; error?: unknown } = await response.json();
    return publicCheck(result.result === "PONG"
      ? { status: "ok", message: "Upstash Redis is available." }
      : {
          status: "error",
          message: "Upstash Redis returned an unexpected response.",
          details: errorDetails(typeof result.error === "string" ? result.error : JSON.stringify(result)),
        });
  } catch (error) {
    return publicCheck({
      status: "error",
      message: "Upstash Redis health check failed. Verify the REST URL and token.",
      details: errorDetails(error),
    });
  }
}

export async function getHealthChecks(): Promise<Record<HealthCheckName, HealthCheck>> {
  const results = await Promise.all(
    HEALTH_CHECK_NAMES.map(async (name) => [name, await getHealthCheck(name)] as const),
  );
  return Object.fromEntries(results) as Record<HealthCheckName, HealthCheck>;
}

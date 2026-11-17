import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyPrivateStorage } from "@/lib/r2";
import { verifyDashboardEmail } from "@/features/contact/services/email";

type Check = { status: "ok" | "not-configured" | "error"; message: string; details?: string };

export async function getHealthChecks(): Promise<Record<string, Check>> {
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
  const errorDetails = (error: unknown) => {
    let message = error instanceof Error ? error.message : String(error);
    for (const secret of secrets) message = message.replaceAll(secret, "[REDACTED]");
    return message || "Unknown error.";
  };
  const checks: Record<string, Check> = {
    environment: { status: "ok", message: "Required server configuration is readable." },
    mongodb: { status: "not-configured", message: "MongoDB is not configured." },
    smtp: { status: "not-configured", message: "SMTP is not configured." },
    r2: { status: "not-configured", message: "Private storage is not configured." },
    upstash: { status: "not-configured", message: "Upstash Redis is not configured." },
  };

  if (env.MONGODB_URI) {
    try {
      await connectToDatabase();
      checks.mongodb = mongoose.connection.readyState === 1
        ? { status: "ok", message: "MongoDB connection is available." }
        : {
            status: "error",
            message: "MongoDB connection is not ready.",
            details: `Connection ready state: ${mongoose.connection.readyState}.`,
          };
    } catch (error) {
      checks.mongodb = { status: "error", message: "MongoDB connection failed.", details: errorDetails(error) };
    }
  }
  if (env.SMTP_USER || env.SMTP_PASS) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      checks.smtp = {
        status: "error",
        message: "SMTP configuration is incomplete.",
        details: `Missing ${!env.SMTP_USER ? "SMTP_USER" : "SMTP_PASS"}.`,
      };
    } else {
      try {
        await verifyDashboardEmail();
        checks.smtp = { status: "ok", message: "SMTP connection is available for dashboard replies." };
      } catch (error) {
        checks.smtp = { status: "error", message: "SMTP connection failed.", details: errorDetails(error) };
      }
    }
  }
  const r2Configuration = {
    R2_ENDPOINT: env.R2_ENDPOINT,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: env.R2_BUCKET_NAME,
  };
  if (Object.values(r2Configuration).some(Boolean)) {
    const missing = Object.entries(r2Configuration)
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length) {
      checks.r2 = {
        status: "error",
        message: "Private storage configuration is incomplete.",
        details: `Missing ${missing.join(", ")}.`,
      };
    } else {
      try {
        await verifyPrivateStorage();
        checks.r2 = { status: "ok", message: "Private storage is available." };
      } catch (error) {
        const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        checks.r2 = {
          status: "error",
          message: status === 403
            ? "R2 rejected the request. Check the API token permissions, bucket scope, bucket name, and account endpoint."
            : "Private storage check failed. Verify the R2 endpoint, bucket name, and credentials.",
          details: errorDetails(error),
        };
      }
    }
  }
  if (env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_TOKEN) {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      checks.upstash = {
        status: "error",
        message: "Upstash Redis configuration is incomplete.",
        details: `Missing ${!env.UPSTASH_REDIS_REST_URL ? "UPSTASH_REDIS_REST_URL" : "UPSTASH_REDIS_REST_TOKEN"}.`,
      };
    } else {
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
          checks.upstash = {
            status: "error",
            message: "Upstash Redis health check failed. Verify the REST URL and token.",
            details: errorDetails(details),
          };
        } else {
          const result: { result?: unknown; error?: unknown } = await response.json();
          checks.upstash = result.result === "PONG"
            ? { status: "ok", message: "Upstash Redis is available." }
            : {
                status: "error",
                message: "Upstash Redis returned an unexpected response.",
                details: errorDetails(typeof result.error === "string" ? result.error : JSON.stringify(result)),
              };
        }
      } catch (error) {
        checks.upstash = {
          status: "error",
          message: "Upstash Redis health check failed. Verify the REST URL and token.",
          details: errorDetails(error),
        };
      }
    }
  }
  if (process.env.NODE_ENV !== "development") {
    for (const check of Object.values(checks)) delete check.details;
  }
  return checks;
}

import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyPrivateStorage } from "@/lib/r2";
import { verifyDashboardEmail } from "@/features/contact/services/email";

type Check = { status: "ok" | "not-configured" | "error"; message: string };

export async function getHealthChecks(): Promise<Record<string, Check>> {
  const env = getServerEnv();
  const checks: Record<string, Check> = {
    environment: { status: "ok", message: "Required server configuration is readable." },
    mongodb: { status: "not-configured", message: "MongoDB is not configured." },
    smtp: { status: "not-configured", message: "SMTP is not configured." },
    r2: { status: "not-configured", message: "Private storage is not configured." },
  };

  if (env.MONGODB_URI) {
    try {
      await connectToDatabase();
      checks.mongodb = { status: mongoose.connection.readyState === 1 ? "ok" : "error", message: mongoose.connection.readyState === 1 ? "MongoDB connection is available." : "MongoDB connection is not ready." };
    } catch {
      checks.mongodb = { status: "error", message: "MongoDB connection failed." };
    }
  }
  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      await verifyDashboardEmail();
      checks.smtp = { status: "ok", message: "SMTP connection is available for dashboard replies." };
    } catch {
      checks.smtp = { status: "error", message: "SMTP connection failed." };
    }
  }
  if (env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME) {
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
      };
    }
  }
  return checks;
}

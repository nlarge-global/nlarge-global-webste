import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/features/admin/auth/session";
import {
  getHealthCheck,
  getHealthChecks,
  HEALTH_CHECK_NAMES,
  type HealthCheckName,
} from "@/features/admin/services/health";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const name = new URL(request.url).searchParams.get("check");
    if (name) {
      if (!HEALTH_CHECK_NAMES.includes(name as HealthCheckName)) {
        return NextResponse.json({ error: "Unknown health check." }, { status: 400 });
      }
      return NextResponse.json({ check: await getHealthCheck(name as HealthCheckName) });
    }
    return NextResponse.json({ checks: await getHealthChecks() });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Health check failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to run health checks.") }, { status: 500 });
  }
}

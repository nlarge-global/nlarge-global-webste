import { NextResponse } from "next/server";
import { requireAdminSession } from "@/features/admin/auth/session";
import { getHealthChecks } from "@/features/admin/services/health";

export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json({ checks: await getHealthChecks() });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Health check failed:", error);
    return NextResponse.json({ error: "Unable to run health checks." }, { status: 500 });
  }
}

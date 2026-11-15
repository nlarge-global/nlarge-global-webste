import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession, revokeCurrentAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) return NextResponse.json({ message: "Signed out" });
    await validateCsrfToken(request, session);
    await revokeCurrentAdminSession();
    await writeAuditEvent({ actor: "admin", action: "auth.logout", resourceType: "session", requestId: getRequestId(request) });
    return NextResponse.json({ message: "Signed out" });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    }
    console.error("Admin logout failed:", error);
    return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  }
}

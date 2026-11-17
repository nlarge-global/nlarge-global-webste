import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Prospect } from "@/features/admin/models/prospect";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { prospectAuditLabel } from "@/features/admin/services/prospect-url";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    await connectToDatabase();
    const prospect = await Prospect.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: true } },
      { $unset: { deletedAt: 1 } },
      { new: true, runValidators: true },
    );
    if (!prospect) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    await writeAuditEvent({
      actor: "admin",
      action: "prospect.restored",
      resourceType: "prospect",
      resourceId: id,
      resourceLabel: prospectAuditLabel(prospect.name, prospect.url),
      requestId: getRequestId(request),
      metadata: { status: prospect.status },
    });
    return NextResponse.json({ message: "Prospect restored." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Prospect restore failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to restore prospect.") }, { status: 500 });
  }
}

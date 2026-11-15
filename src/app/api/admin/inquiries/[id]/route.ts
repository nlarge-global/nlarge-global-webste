import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    if (request.headers.get("x-confirm-delete") !== id) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    await connectToDatabase();
    const inquiry = await Inquiry.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "inquiry.deleted", resourceType: "inquiry", resourceId: id, requestId: getRequestId(request), metadata: { softDelete: true } });
    return NextResponse.json({ message: "Inquiry archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Inquiry deletion failed:", error);
    return NextResponse.json({ error: "Unable to archive inquiry." }, { status: 500 });
  }
}

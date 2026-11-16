import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Subscriber } from "@/features/contact/models/subscriber";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    }
    if (request.headers.get("x-confirm-delete") !== id) {
      return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    }

    await connectToDatabase();
    const subscriber = await Subscriber.findByIdAndDelete(id).select("_id");
    if (!subscriber) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });

    await writeAuditEvent({
      actor: "admin",
      action: "subscriber.deleted",
      resourceType: "subscriber",
      resourceId: id,
      requestId: getRequestId(request),
      metadata: { status: "deleted" },
    });
    return NextResponse.json({ message: "Subscriber deleted." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    }
    console.error("Subscriber deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete subscriber." }, { status: 500 });
  }
}

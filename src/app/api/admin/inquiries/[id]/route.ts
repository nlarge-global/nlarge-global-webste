import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { z } from "zod";
import { Task } from "@/features/admin/models/task";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { getDeleteMode } from "@/features/admin/services/delete-mode";

const updateSchema = z.object({
  status: z.enum(["new", "in-progress", "converted", "archived"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    const data = updateSchema.parse(await request.json());
    await connectToDatabase();
    const inquiry = await Inquiry.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean();
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    await writeAuditEvent({
      actor: "admin",
      action: "inquiry.updated",
      resourceType: "inquiry",
      resourceId: id,
      resourceLabel: inquiry.subject,
      requestId: getRequestId(request),
      metadata: { status: inquiry.status, priority: inquiry.priority },
    });
    return NextResponse.json({ status: inquiry.status, priority: inquiry.priority });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Choose a valid status or priority." }, { status: 400 });
    console.error("Inquiry update failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to update inquiry.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    if (request.headers.get("x-confirm-delete") !== id) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    const mode = getDeleteMode(request);
    if (!mode) return NextResponse.json({ error: "Choose archive or permanent deletion." }, { status: 400 });
    await connectToDatabase();
    const inquiry = mode === "permanent"
      ? await Inquiry.findById(id)
      : await Inquiry.findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } }, { returnDocument: "after" });
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    if (mode === "permanent") {
      await Promise.all([
        ConversationEntry.deleteMany({ inquiryId: id }),
        Task.deleteMany({ inquiryId: id }),
      ]);
      await inquiry.deleteOne();
    }
    await writeAuditEvent({ actor: "admin", action: "inquiry.deleted", resourceType: "inquiry", resourceId: id, resourceLabel: inquiry.subject, requestId: getRequestId(request), metadata: { [mode === "permanent" ? "permanentDelete" : "softDelete"]: true, status: inquiry.status } });
    return NextResponse.json({ message: mode === "permanent" ? "Inquiry and its conversation permanently deleted." : "Inquiry archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Inquiry deletion failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to delete inquiry.") }, { status: 500 });
  }
}

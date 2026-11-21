import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { Inquiry } from "@/features/admin/models/inquiry";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { getRecordActionMode } from "@/features/admin/services/delete-mode";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const entrySchema = z.object({
  channel: z.enum(["email", "whatsapp", "phone", "meeting", "internal-note"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  content: z.string().trim().min(1).max(5000),
  occurredAt: z.coerce.date(),
});
const updateSchema = entrySchema.partial().refine((value) => Object.keys(value).length > 0);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    await requireAdminSession();
    const { id, entryId } = await params;
    if (!idSchema.safeParse(id).success || !idSchema.safeParse(entryId).success) {
      return NextResponse.json({ error: "Invalid conversation entry." }, { status: 400 });
    }
    await connectToDatabase();
    const entry = await ConversationEntry.findOne({ _id: entryId, inquiryId: id })
      .select("_id channel direction content occurredAt createdAt updatedAt")
      .lean();
    if (!entry) return NextResponse.json({ error: "Conversation entry not found." }, { status: 404 });
    return NextResponse.json({
      entry: {
        _id: String(entry._id),
        channel: entry.channel,
        direction: entry.direction,
        content: entry.content,
        occurredAt: entry.occurredAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Conversation entry details failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load entry details.") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, entryId } = await params;
    if (!idSchema.safeParse(id).success || !idSchema.safeParse(entryId).success) {
      return NextResponse.json({ error: "Invalid conversation entry." }, { status: 400 });
    }
    const data = updateSchema.parse(await request.json());
    await connectToDatabase();
    const entry = await ConversationEntry.findOneAndUpdate(
      { _id: entryId, inquiryId: id, deletedAt: { $exists: false } },
      data,
      { returnDocument: "after", runValidators: true },
    );
    if (!entry) return NextResponse.json({ error: "Conversation entry not found." }, { status: 404 });
    await writeAuditEvent({
      actor: "admin",
      action: "conversation.updated",
      resourceType: "inquiry",
      resourceId: id,
      resourceLabel: entry.channel,
      requestId: getRequestId(request),
      metadata: { entryId, channel: entry.channel, direction: entry.direction },
    });
    return NextResponse.json({
      entry: {
        _id: String(entry._id),
        channel: entry.channel,
        direction: entry.direction,
        content: entry.content,
        occurredAt: entry.occurredAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid conversation entry." }, { status: 400 });
    console.error("Conversation entry update failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to update entry.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, entryId } = await params;
    if (!idSchema.safeParse(id).success || !idSchema.safeParse(entryId).success) {
      return NextResponse.json({ error: "Invalid conversation entry." }, { status: 400 });
    }
    if (request.headers.get("x-confirm-delete") !== entryId) {
      return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    }
    const mode = getRecordActionMode(request);
    if (!mode) return NextResponse.json({ error: "Choose archive or permanent deletion." }, { status: 400 });
    await connectToDatabase();
    const filter = { _id: entryId, inquiryId: id };
    const entry = mode === "restore"
      ? await ConversationEntry.findOneAndUpdate(
          { ...filter, deletedAt: { $exists: true } },
          { $unset: { deletedAt: 1 } },
          { returnDocument: "after" },
        )
      : mode === "permanent"
        ? await ConversationEntry.findOneAndDelete(filter)
        : await ConversationEntry.findOneAndUpdate(
            { ...filter, deletedAt: { $exists: false } },
            { $set: { deletedAt: new Date() } },
            { returnDocument: "after" },
          );
    if (!entry) return NextResponse.json({ error: "Conversation entry not found." }, { status: 404 });
    await writeAuditEvent({
      actor: "admin",
      action: mode === "restore" ? "conversation.restored" : "conversation.deleted",
      resourceType: "inquiry",
      resourceId: id,
      resourceLabel: entry.channel,
      requestId: getRequestId(request),
      metadata: { entryId, channel: entry.channel, direction: entry.direction, [mode === "permanent" ? "permanentDelete" : mode === "restore" ? "restored" : "softDelete"]: true },
    });
    return NextResponse.json({ message: mode === "permanent" ? "Conversation entry permanently deleted." : mode === "restore" ? "Conversation entry restored." : "Conversation entry archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Conversation entry deletion failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to delete entry.") }, { status: 500 });
  }
}

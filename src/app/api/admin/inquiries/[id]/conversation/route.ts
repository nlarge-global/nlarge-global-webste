import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { Inquiry } from "@/features/admin/models/inquiry";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const entrySchema = z.object({
  channel: z.enum(["email", "whatsapp", "phone", "meeting", "internal-note"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  content: z.string().trim().min(1).max(5000),
  occurredAt: z.coerce.date(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    void session;
    const { id } = await params;
    await connectToDatabase();
    const entries = await ConversationEntry.find({ inquiryId: id }).sort({ occurredAt: -1 }).lean();
    return NextResponse.json({ entries });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Conversation timeline read failed:", error);
    return NextResponse.json({ error: "Unable to load conversation." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    const data = entrySchema.parse(await request.json());
    await connectToDatabase();
    const inquiry = await Inquiry.findById(id).select("_id");
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    const entry = await ConversationEntry.create({ ...data, inquiryId: inquiry._id });
    await writeAuditEvent({ actor: "admin", action: "conversation.created", resourceType: "inquiry", resourceId: id, requestId: getRequestId(request), metadata: { channel: data.channel, direction: data.direction } });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid conversation entry." }, { status: 400 });
    console.error("Conversation timeline write failed:", error);
    return NextResponse.json({ error: "Unable to save conversation entry." }, { status: 500 });
  }
}

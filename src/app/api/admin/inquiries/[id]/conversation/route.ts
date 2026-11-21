import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { Inquiry } from "@/features/admin/models/inquiry";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const PAGE_SIZE = 30;

const channelValues = ["email", "whatsapp", "phone", "meeting", "internal-note"] as const;
const directionValues = ["inbound", "outbound", "internal"] as const;

const entrySchema = z.object({
  channel: z.enum(["email", "whatsapp", "phone", "meeting", "internal-note"]),
  direction: z.enum(["inbound", "outbound", "internal"]),
  content: z.string().trim().min(1).max(5000),
  occurredAt: z.coerce.date(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    if (!await Inquiry.exists({ _id: id })) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    const searchParams = _request.nextUrl.searchParams;
    const channel = searchParams.get("channel");
    const direction = searchParams.get("direction");
    const search = searchParams.get("q")?.trim().slice(0, 100);
    const archive = searchParams.get("archive");
    const includeDeleted = archive === "archived" || archive === "all";
    const beforeAt = searchParams.get("beforeAt");
    const beforeId = searchParams.get("beforeId");
    if (Boolean(beforeAt) !== Boolean(beforeId)) {
      return NextResponse.json({ error: "Both timeline cursor values are required." }, { status: 400 });
    }
    if (channel && !channelValues.includes(channel as (typeof channelValues)[number])) {
      return NextResponse.json({ error: "Invalid timeline channel." }, { status: 400 });
    }
    if (direction && !directionValues.includes(direction as (typeof directionValues)[number])) {
      return NextResponse.json({ error: "Invalid timeline direction." }, { status: 400 });
    }
    const filter: Record<string, unknown> = {
      inquiryId: id,
      ...(channel ? { channel } : {}),
      ...(direction ? { direction } : {}),
      ...(search ? { content: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {}),
      ...(archive === "active" || !archive ? { deletedAt: { $exists: false } } : {}),
      ...(archive === "archived" ? { deletedAt: { $exists: true } } : {}),
    };
    if (beforeAt && beforeId) {
      const cursorDate = new Date(beforeAt);
      if (Number.isNaN(cursorDate.getTime()) || !/^[a-f\d]{24}$/i.test(beforeId)) {
        return NextResponse.json({ error: "Invalid timeline cursor." }, { status: 400 });
      }
      filter.$or = [
        { occurredAt: { $lt: cursorDate } },
        { occurredAt: cursorDate, _id: { $lt: beforeId } },
      ];
    }
    const page = await ConversationEntry.find(filter)
      .setOptions({ includeDeleted })
      .sort({ occurredAt: -1, _id: -1 })
      .limit(PAGE_SIZE + 1)
      .select("_id channel direction content occurredAt deletedAt")
      .lean();
    const hasMore = page.length > PAGE_SIZE;
    const entries = page.slice(0, PAGE_SIZE);
    return NextResponse.json({ entries, hasMore });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Conversation timeline read failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load conversation.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    const data = entrySchema.parse(await request.json());
    await connectToDatabase();
    const inquiry = await Inquiry.findById(id).select("_id subject");
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    const entry = await ConversationEntry.create({ ...data, inquiryId: inquiry._id });
    await writeAuditEvent({ actor: "admin", action: "conversation.created", resourceType: "inquiry", resourceId: id, resourceLabel: inquiry.subject, requestId: getRequestId(request), metadata: { channel: data.channel, direction: data.direction } });
    return NextResponse.json({ entry: { _id: String(entry._id), channel: entry.channel, direction: entry.direction, content: entry.content, occurredAt: entry.occurredAt.toISOString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid conversation entry." }, { status: 400 });
    console.error("Conversation timeline write failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to save conversation entry.") }, { status: 500 });
  }
}

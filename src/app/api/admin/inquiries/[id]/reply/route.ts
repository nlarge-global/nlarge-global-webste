import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { EmailRecord } from "@/features/admin/models/email-record";
import { Inquiry } from "@/features/admin/models/inquiry";
import { Settings } from "@/features/admin/models/settings";
import { sendDashboardReply } from "@/features/contact/services/email";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const replySchema = z.object({
  subject: z.string().trim().min(1).max(150).refine((value) => !/[\r\n]/.test(value), "Invalid subject"),
  message: z.string().trim().min(1).max(5000),
  signature: z.string().trim().min(1).max(500),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const [inquiry, settings] = await Promise.all([
      Inquiry.findById(id).select("email subject").lean(),
      Settings.findOne({ key: "dashboard" }).select("emailSignature defaultReplyTemplate").lean(),
    ]);
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    return NextResponse.json({
      recipient: inquiry.email,
      subject: `Re: ${inquiry.subject}`.slice(0, 150),
      message: settings?.defaultReplyTemplate ?? "Thank you for your message. We will review this and get back to you shortly.",
      signature: settings?.emailSignature ?? "Best regards,\nNLarge Global",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Reply defaults read failed:", error);
    return NextResponse.json({ error: "Unable to load reply defaults." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = replySchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    const inquiry = await Inquiry.findById(id).select("email subject");
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

    await sendDashboardReply({ ...data, recipient: inquiry.email });
    const sentAt = new Date();
    await EmailRecord.create({
      inquiryId: inquiry._id,
      direction: "outbound",
      recipient: inquiry.email,
      subject: data.subject,
      status: "sent",
      sentAt,
    });
    const entry = await ConversationEntry.create({
      inquiryId: inquiry._id,
      channel: "email",
      direction: "outbound",
      content: `${data.subject}\n\n${data.message}\n\n${data.signature}`,
      occurredAt: sentAt,
    });
    await writeAuditEvent({ actor: "admin", action: "email.reply.sent", resourceType: "inquiry", resourceId: id, resourceLabel: inquiry.subject, requestId: getRequestId(request), metadata: { channel: "email", direction: "outbound" } });
    return NextResponse.json({
      message: "Reply sent.",
      entry: {
        _id: String(entry._id),
        channel: entry.channel,
        direction: entry.direction,
        content: entry.content,
        occurredAt: entry.occurredAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid reply." }, { status: 400 });
    console.error("Dashboard reply failed:", error);
    return NextResponse.json({ error: "Unable to send reply." }, { status: 500 });
  }
}

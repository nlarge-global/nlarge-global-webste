import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(254),
  queryType: z.enum(["general", "support", "business", "careers", "privacy"]),
  subject: z.string().trim().min(5).max(100).refine((value) => !/[\r\n]/.test(value)),
  message: z.string().trim().min(1).max(1000),
  source: z.enum(["whatsapp", "linkedin", "call", "friend", "personal", "referral", "other"]).default("other"),
  status: z.enum(["new", "in-progress", "converted", "archived"]).default("new"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = inquirySchema.parse(await request.json());
    await connectToDatabase();
    const inquiry = await Inquiry.create({
      ...data,
      origin: "manual",
      idempotencyKey: `admin-${crypto.randomUUID()}`,
    });
    await writeAuditEvent({
      actor: "admin",
      action: "inquiry.created",
      resourceType: "inquiry",
      resourceId: String(inquiry._id),
      resourceLabel: inquiry.subject,
      requestId: getRequestId(request),
      metadata: { source: inquiry.source, status: inquiry.status, priority: inquiry.priority },
    });
    return NextResponse.json({ id: String(inquiry._id) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Check the inquiry details and try again." }, { status: 400 });
    console.error("Manual inquiry creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to create inquiry.") }, { status: 500 });
  }
}

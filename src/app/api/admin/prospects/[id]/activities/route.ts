import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Prospect } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { prospectAuditLabel } from "@/features/admin/services/prospect-url";

const activitySchema = z.object({
  type: z.enum(["note", "call", "email", "message", "meeting"]),
  content: z.string().trim().min(1).max(3000),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    const before = request.nextUrl.searchParams.get("before");
    if (before && !/^[a-f\d]{24}$/i.test(before)) return NextResponse.json({ error: "Invalid activity cursor." }, { status: 400 });
    await connectToDatabase();
    const prospect = await Prospect.findById(id);
    if (!prospect) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    const filter = before
      ? { prospectId: id, _id: { $lt: before } }
      : { prospectId: id };
    const activities = await ProspectActivity.find(filter).sort({ _id: -1 }).limit(21).lean();
    return NextResponse.json({
      activities: activities.slice(0, 20).map((activity) => ({
        id: String(activity._id),
        type: activity.type,
        content: activity.content,
        occurredAt: activity.occurredAt.toISOString(),
      })),
      hasMore: activities.length > 20,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Prospect activity read failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load prospect activity.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = activitySchema.parse(await request.json());
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    await connectToDatabase();
    const prospect = await Prospect.findById(id);
    if (!prospect) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    const activity = await ProspectActivity.create({
      prospectId: prospect._id,
      type: data.type,
      content: data.content,
      occurredAt: new Date(),
    });
    await writeAuditEvent({
      actor: "admin",
      action: "prospect.activity.created",
      resourceType: "prospect",
      resourceId: id,
      resourceLabel: prospectAuditLabel(prospect.name, prospect.url),
      requestId: getRequestId(request),
      metadata: { type: activity.type },
    });
    return NextResponse.json({
      activity: {
        id: String(activity._id),
        type: activity.type,
        content: activity.content,
        occurredAt: activity.occurredAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid activity and a note." }, { status: 400 });
    console.error("Prospect activity create failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to save activity.") }, { status: 500 });
  }
}

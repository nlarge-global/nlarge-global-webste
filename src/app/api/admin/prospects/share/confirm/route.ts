import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  consumePendingAdminShare,
  requireAdminSession,
  validateCsrfToken,
} from "@/features/admin/auth/session";
import { Prospect } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { prospectAuditLabel, sourceFromProspectUrl } from "@/features/admin/services/prospect-url";
import { connectToDatabase } from "@/lib/mongodb";

const confirmationSchema = z.object({ shareId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { shareId } = confirmationSchema.parse(await request.json());
    const pendingShare = await consumePendingAdminShare(String(session._id), shareId);
    if (!pendingShare) {
      return NextResponse.json(
        { error: "This shared link has expired or was already saved. Share it again to continue." },
        { status: 409 },
      );
    }

    await connectToDatabase();
    const prospect = await Prospect.create({
      name: pendingShare.name,
      url: pendingShare.url,
      source: sourceFromProspectUrl(pendingShare.url),
      status: "to-review",
      notes: pendingShare.notes,
    });
    await ProspectActivity.create({
      prospectId: prospect._id,
      type: "note",
      content: "Added from the phone's share menu.",
      occurredAt: prospect.createdAt,
    });
    await writeAuditEvent({
      actor: "admin",
      action: "prospect.shared",
      resourceType: "prospect",
      resourceId: String(prospect._id),
      resourceLabel: prospectAuditLabel(prospect.name, prospect.url),
      requestId: getRequestId(request),
      metadata: { source: prospect.source, status: prospect.status },
    });

    return NextResponse.json({ id: String(prospect._id) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid share confirmation." }, { status: 400 });
    }
    console.error("Shared prospect confirmation failed:", error);
    return NextResponse.json(
      { error: getDisplayErrorMessage(error, "Unable to save the shared link.") },
      { status: 500 },
    );
  }
}

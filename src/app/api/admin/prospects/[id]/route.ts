import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Prospect } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { normalizeProspectUrl, prospectAuditLabel } from "@/features/admin/services/prospect-url";

const updateSchema = z.object({
  name: z.string().trim().max(150).optional(),
  url: z.string().trim().max(2048).optional(),
  source: z.enum(["google-maps", "instagram", "linkedin", "website", "referral", "call", "other"]).optional(),
  notes: z.string().trim().max(5000).optional(),
  status: z.enum(["to-review", "ready-to-contact", "contacted", "responded", "converted", "not-a-fit"]).optional(),
  nextAction: z.string().trim().max(500).optional(),
  followUpAt: z.union([z.iso.date(), z.literal("")]).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0)
  .refine((value) => !value.url || Boolean(normalizeProspectUrl(value.url)), { message: "Enter a valid website URL." });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    await connectToDatabase();
    const prospect = await Prospect.findById(id).lean();
    if (!prospect) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    return NextResponse.json({
      prospect: {
        id: String(prospect._id),
        name: prospect.name ?? "",
        url: prospect.url ?? "",
        source: prospect.source,
        status: prospect.status,
        notes: prospect.notes ?? "",
        nextAction: prospect.nextAction ?? "",
        followUpAt: prospect.followUpAt?.toISOString().slice(0, 10) ?? "",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Prospect read failed:", error);
    return NextResponse.json({ error: "Unable to load prospect." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = updateSchema.parse(await request.json());
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    await connectToDatabase();
    const prospect = await Prospect.findById(id);
    if (!prospect) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    const nextName = data.name ?? prospect.name ?? "";
    const nextUrl = data.url ?? prospect.url ?? "";
    if (!nextName.trim() && !nextUrl.trim()) return NextResponse.json({ error: "Keep a name or URL on the prospect." }, { status: 400 });
    const oldStatus = prospect.status;
    const { followUpAt, ...fields } = data;
    const update: Record<string, unknown> = {
      ...fields,
      name: fields.name || undefined,
      url: fields.url ? normalizeProspectUrl(fields.url) : undefined,
      notes: fields.notes || undefined,
      nextAction: fields.nextAction || undefined,
    };
    if (followUpAt !== undefined) update.followUpAt = followUpAt ? new Date(`${followUpAt}T00:00:00.000Z`) : undefined;
    Object.assign(prospect, update);
    await prospect.save();
    if (data.status && data.status !== oldStatus) {
      await ProspectActivity.create({
        prospectId: prospect._id,
        type: "status-change",
        content: `Status changed from ${oldStatus} to ${data.status}.`,
        occurredAt: new Date(),
      });
    }
    await writeAuditEvent({
      actor: "admin",
      action: "prospect.updated",
      resourceType: "prospect",
      resourceId: id,
      resourceLabel: prospectAuditLabel(prospect.name, prospect.url),
      requestId: getRequestId(request),
      metadata: { source: prospect.source, status: prospect.status },
    });
    return NextResponse.json({ status: prospect.status });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid prospect details." }, { status: 400 });
    console.error("Prospect update failed:", error);
    return NextResponse.json({ error: "Unable to update prospect." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    if (request.headers.get("x-confirm-delete") !== id) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    await connectToDatabase();
    const prospect = await Prospect.findById(id);
    if (!prospect) return NextResponse.json({ error: "Prospect not found." }, { status: 404 });
    prospect.deletedAt = new Date();
    await prospect.save();
    await writeAuditEvent({
      actor: "admin",
      action: "prospect.deleted",
      resourceType: "prospect",
      resourceId: id,
      resourceLabel: prospectAuditLabel(prospect.name, prospect.url),
      requestId: getRequestId(request),
      metadata: { softDelete: true },
    });
    return NextResponse.json({ message: "Prospect archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Prospect archive failed:", error);
    return NextResponse.json({ error: "Unable to archive prospect." }, { status: 500 });
  }
}

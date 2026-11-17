import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Prospect, type ProspectSource, type ProspectStatus } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { normalizeProspectUrl, prospectAuditLabel } from "@/features/admin/services/prospect-url";

const prospectSchema = z.object({
  name: z.string().trim().max(150).optional(),
  url: z.string().trim().max(2048).optional(),
  source: z.enum(["google-maps", "instagram", "linkedin", "website", "referral", "call", "other"]).default("other"),
  notes: z.string().trim().max(5000).optional(),
  nextAction: z.string().trim().max(500).optional(),
  followUpAt: z.union([z.iso.date(), z.literal("")]).optional(),
}).refine((value) => Boolean(value.name || value.url), { message: "Add a name or URL." })
  .refine((value) => !value.url || Boolean(normalizeProspectUrl(value.url)), { message: "Enter a valid website URL." });

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const status = params.get("status");
    const source = params.get("source");
    const archived = params.get("archived") === "true";
    const query = params.get("q")?.trim().slice(0, 100);
    const filter: {
      status?: ProspectStatus;
      source?: ProspectSource;
      deletedAt?: { $exists: boolean };
      followUpAt?: { $exists: true; $lt: Date };
      $or?: Array<Partial<Record<"name" | "url" | "notes" | "nextAction", RegExp>>>;
    } = {};
    filter.deletedAt = { $exists: archived };
    if (status && ["to-review", "ready-to-contact", "contacted", "responded", "converted", "not-a-fit"].includes(status)) filter.status = status as ProspectStatus;
    if (source && ["google-maps", "instagram", "linkedin", "website", "referral", "call", "other"].includes(source)) filter.source = source as ProspectSource;
    if (params.get("followUp") === "due") {
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      filter.followUpAt = { $exists: true, $lt: tomorrow };
    }
    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      filter.$or = [{ name: regex }, { url: regex }, { notes: regex }, { nextAction: regex }];
    }

    await connectToDatabase();
    const pageSize = 10;
    const [prospects, total] = await Promise.all([
      Prospect.collection.find(filter).sort({ followUpAt: 1, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      Prospect.collection.countDocuments(filter),
    ]);
    return NextResponse.json({
      prospects: prospects.map((prospect) => ({
        id: String(prospect._id),
        name: prospect.name ?? "",
        url: prospect.url ?? "",
        source: prospect.source,
        status: prospect.status,
        nextAction: prospect.nextAction ?? "",
        followUpAt: prospect.followUpAt?.toISOString() ?? null,
        createdAt: prospect.createdAt.toISOString(),
        archived: Boolean(prospect.deletedAt),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Prospect list failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load prospects.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = prospectSchema.parse(await request.json());
    const url = data.url ? normalizeProspectUrl(data.url) : undefined;
    if (data.url && !url) return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 });
    await connectToDatabase();
    const prospect = await Prospect.create({
      ...data,
      url: url ?? undefined,
      name: data.name || undefined,
      notes: data.notes || undefined,
      nextAction: data.nextAction || undefined,
      followUpAt: data.followUpAt ? new Date(`${data.followUpAt}T00:00:00.000Z`) : undefined,
      status: "to-review",
    });
    await ProspectActivity.create({
      prospectId: prospect._id,
      type: "note",
      content: "Prospect added manually.",
      occurredAt: prospect.createdAt,
    });
    await writeAuditEvent({
      actor: "admin",
      action: "prospect.created",
      resourceType: "prospect",
      resourceId: String(prospect._id),
      resourceLabel: prospectAuditLabel(prospect.name, prospect.url),
      requestId: getRequestId(request),
      metadata: { source: prospect.source, status: prospect.status },
    });
    return NextResponse.json({ id: String(prospect._id) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Check the prospect details." }, { status: 400 });
    console.error("Prospect creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to create prospect.") }, { status: 500 });
  }
}

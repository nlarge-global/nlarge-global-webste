import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Prospect } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { connectToDatabase } from "@/lib/mongodb";
import { extractSharedUrl, prospectAuditLabel, sourceFromProspectUrl } from "@/features/admin/services/prospect-url";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

function shareRedirect(request: NextRequest, result: "created" | "signin" | "error") {
  const destination = new URL(result === "signin" ? "/admin/login" : "/admin/prospects", request.url);
  destination.searchParams.set("share", result);
  return NextResponse.redirect(destination, 303);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/x-www-form-urlencoded") && !contentType.startsWith("multipart/form-data")) {
      return shareRedirect(request, "error");
    }
    const fetchSite = request.headers.get("sec-fetch-site");
    const origin = request.headers.get("origin");
    if (fetchSite === "cross-site" || (origin && new URL(origin).origin !== request.nextUrl.origin)) {
      return shareRedirect(request, "error");
    }
    const session = await getCurrentAdminSession();
    if (!session) return shareRedirect(request, "signin");
    const form = await request.formData();
    const sharedUrl = form.get("url");
    const sharedText = form.get("text");
    const normalizedUrl = extractSharedUrl(sharedUrl, sharedText);
    if (!normalizedUrl) return shareRedirect(request, "error");
    const title = form.get("title");
    const name = typeof title === "string" ? title.trim().replace(/\s+/g, " ").slice(0, 150) : "";
    const notes = typeof sharedText === "string" ? sharedText.trim().slice(0, 5000) : "";

    await connectToDatabase();
    const prospect = await Prospect.create({
      name: name || undefined,
      url: normalizedUrl,
      source: sourceFromProspectUrl(normalizedUrl),
      status: "to-review",
      notes: notes || undefined,
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
    return shareRedirect(request, "created");
  } catch (error) {
    console.error("Shared prospect capture failed:", error);
    return shareRedirect(request, "error");
  }
}

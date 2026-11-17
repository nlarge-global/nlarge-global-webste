import { NextRequest, NextResponse } from "next/server";
import { getDisplayErrorMessage } from "@/lib/error-message";
import crypto from "node:crypto";
import { getAdminShareSessionDiagnostics, stageAdminShare } from "@/features/admin/auth/session";
import { extractSharedUrl } from "@/features/admin/services/prospect-url";
import { isAllowedShareTargetRequest } from "@/features/admin/services/prospect-share-request";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

function shareRedirect(request: NextRequest, result: "confirm" | "signin" | "error", detail?: string) {
  const destination = new URL(result === "signin" ? "/admin/login" : "/admin/prospects", request.url);
  destination.searchParams.set("share", result);
  if (result === "error" && detail && process.env.NODE_ENV === "development") {
    destination.searchParams.set("shareError", detail.slice(0, 500));
  }
  return NextResponse.redirect(destination, 303);
}

async function writeShareDiagnostic(
  request: NextRequest,
  requestId: string,
  stage: string,
  result: string,
  details: Record<string, string | boolean>,
) {
  // Temporary diagnostics; remove after the deployed Google Maps share attempt is diagnosed.
  try {
    await writeAuditEvent({
      actor: "public",
      action: "prospect.share_diagnostic",
      resourceType: "share-request",
      requestId,
      metadata: {
        diagnosticStage: stage,
        diagnosticResult: result,
        contentType: request.headers.get("content-type")?.split(";")[0] ?? "missing",
        fetchSite: request.headers.get("sec-fetch-site") ?? "missing",
        fetchMode: request.headers.get("sec-fetch-mode") ?? "missing",
        fetchDest: request.headers.get("sec-fetch-dest") ?? "missing",
        ...details,
      },
    });
  } catch (error) {
    console.error("Share diagnostic audit write failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let stage = "request-received";
  let sessionDetails: Record<string, string | boolean> = {};
  const origin = request.headers.get("origin");
  let originMatches = false;
  try {
    originMatches = origin ? new URL(origin).origin === request.nextUrl.origin : false;
  } catch {
    originMatches = false;
  }
  const fetchSite = request.headers.get("sec-fetch-site") ?? "missing";
  const fetchMode = request.headers.get("sec-fetch-mode") ?? "missing";
  const fetchDest = request.headers.get("sec-fetch-dest") ?? "missing";
  const contentType = request.headers.get("content-type") ?? "";
  const contentTypeValid =
    contentType.startsWith("application/x-www-form-urlencoded") ||
    contentType.startsWith("multipart/form-data");
  const shareNavigation =
    fetchMode === "navigate" && fetchDest === "document";
  const requestDetails: Record<string, string | boolean> = {
    originPresent: Boolean(origin),
    originMatches,
    fetchSite,
    fetchMode,
    fetchDest,
    contentType: contentType.split(";")[0] || "missing",
    contentTypeValid,
    shareNavigation,
  };
  try {
    if (!contentTypeValid) {
      throw new Error("The shared link must be submitted as a form.");
    }
    stage = "request-metadata-check";
    if (fetchSite === "cross-site" && shareNavigation) {
      stage = "share-navigation-accepted";
    }
    if (!isAllowedShareTargetRequest(request, request.nextUrl.origin)) {
      throw new Error("The share request must come from the app or a browser share action.");
    }
    stage = "session-check";
    const { session, shareCookiePresent, adminCookiePresent } =
      await getAdminShareSessionDiagnostics();
    sessionDetails = { shareCookiePresent, adminCookiePresent, sessionValid: Boolean(session) };
    if (!session) {
      await writeShareDiagnostic(request, requestId, stage, "signin-required", {
        ...requestDetails,
        ...sessionDetails,
      });
      return shareRedirect(request, "signin");
    }
    stage = "payload-validation";
    const form = await request.formData();
    const sharedUrl = form.get("url");
    const sharedText = form.get("text");
    const sharedTitle = form.get("title");
    requestDetails.urlFieldType = sharedUrl === null ? "missing" : typeof sharedUrl;
    requestDetails.textFieldType = sharedText === null ? "missing" : typeof sharedText;
    requestDetails.titleFieldType = sharedTitle === null ? "missing" : typeof sharedTitle;
    const normalizedUrl = extractSharedUrl(sharedUrl, sharedText);
    if (!normalizedUrl) {
      throw new Error(
        `No valid HTTP or HTTPS link was found in the shared URL or text (url field: ${requestDetails.urlFieldType}, text field: ${requestDetails.textFieldType}).`,
      );
    }
    const name = typeof sharedTitle === "string" ? sharedTitle.trim().replace(/\s+/g, " ").slice(0, 150) : "";
    const notes = typeof sharedText === "string" ? sharedText.trim().slice(0, 5000) : "";

    await stageAdminShare(String(session._id), {
      id: crypto.randomUUID(),
      name: name || undefined,
      url: normalizedUrl,
      notes: notes || undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await writeShareDiagnostic(request, requestId, "draft-staged", "confirmation-required", {
      ...requestDetails,
      ...sessionDetails,
    });
    return shareRedirect(request, "confirm");
  } catch (error) {
    console.error("Shared prospect capture failed:", error);
    await writeShareDiagnostic(request, requestId, stage, "error", {
      failureKind: error instanceof Error ? error.name : "unknown",
      failureReason: error instanceof Error ? error.message.slice(0, 200) : "Unknown share error",
      ...requestDetails,
      ...sessionDetails,
    });
    return shareRedirect(request, "error", getDisplayErrorMessage(error, "Unable to save the shared link."));
  }
}

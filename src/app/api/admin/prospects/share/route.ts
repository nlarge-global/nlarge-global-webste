import { NextRequest, NextResponse } from "next/server";
import { getDisplayErrorMessage } from "@/lib/error-message";
import crypto from "node:crypto";
import { getCurrentAdminShareSession, stageAdminShare } from "@/features/admin/auth/session";
import { extractSharedUrl } from "@/features/admin/services/prospect-url";
import { isAllowedShareTargetRequest } from "@/features/admin/services/prospect-share-request";

function shareRedirect(request: NextRequest, result: "confirm" | "signin" | "error", detail?: string) {
  const destination = new URL(result === "signin" ? "/admin/login" : "/admin/prospects", request.url);
  destination.searchParams.set("share", result);
  if (result === "error" && detail && process.env.NODE_ENV === "development") {
    destination.searchParams.set("shareError", detail.slice(0, 500));
  }
  return NextResponse.redirect(destination, 303);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/x-www-form-urlencoded") && !contentType.startsWith("multipart/form-data")) {
      throw new Error("The shared link must be submitted as a form.");
    }
    if (!isAllowedShareTargetRequest(request, request.nextUrl.origin)) {
      throw new Error("The share request must come from the app or a browser share action.");
    }
    const session = await getCurrentAdminShareSession();
    if (!session) return shareRedirect(request, "signin");
    const form = await request.formData();
    const sharedUrl = form.get("url");
    const sharedText = form.get("text");
    const normalizedUrl = extractSharedUrl(sharedUrl, sharedText);
    if (!normalizedUrl) {
      throw new Error("No valid HTTP or HTTPS link was found in the shared URL or text.");
    }
    const title = form.get("title");
    const name = typeof title === "string" ? title.trim().replace(/\s+/g, " ").slice(0, 150) : "";
    const notes = typeof sharedText === "string" ? sharedText.trim().slice(0, 5000) : "";

    await stageAdminShare(String(session._id), {
      id: crypto.randomUUID(),
      name: name || undefined,
      url: normalizedUrl,
      notes: notes || undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    return shareRedirect(request, "confirm");
  } catch (error) {
    console.error("Shared prospect capture failed:", error);
    return shareRedirect(request, "error", getDisplayErrorMessage(error, "Unable to save the shared link."));
  }
}

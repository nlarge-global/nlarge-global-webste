import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/features/admin/auth/session";
import { Subscriber } from "@/features/contact/models/subscriber";
import { createUnsubscribeToken } from "@/features/contact/services/unsubscribe-token";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { siteUrl } from "@/lib/site";

function csvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    await connectToDatabase();
    const subscribers = await Subscriber.find({ status: "subscribed" })
      .sort({ createdAt: 1 })
      .lean();
    const lines = [
      ["email", "status", "consent_history", "unsubscribe_url"].map(csvCell).join(","),
      ...subscribers.map((subscriber) => {
        const unsubscribeUrl = new URL("/unsubscribe", siteUrl);
        unsubscribeUrl.searchParams.set(
          "token",
          createUnsubscribeToken(subscriber.unsubscribeKey),
        );
        return [
          subscriber.email,
          subscriber.status,
          JSON.stringify(subscriber.consentEvents.map(({ action, version, text, occurredAt, source }) => ({
            action,
            version,
            text,
            occurredAt,
            source,
          }))),
          unsubscribeUrl.toString(),
        ].map(csvCell).join(",");
      }),
    ];

    await writeAuditEvent({
      actor: "admin",
      action: "subscriber.exported",
      resourceType: "subscriber",
      requestId: getRequestId(request),
      metadata: { channel: "email", status: "subscribed", size: subscribers.length },
    });

    return new Response(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nlarge-subscribers.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Subscriber export failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to export subscribers.") }, { status: 500 });
  }
}

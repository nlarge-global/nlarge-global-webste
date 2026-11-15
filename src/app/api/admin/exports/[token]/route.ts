import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/features/admin/auth/session";
import { ExportJob } from "@/features/admin/models/export-job";
import { Client } from "@/features/admin/models/client";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { createPrivateObjectUrl } from "@/lib/r2";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await requireAdminSession();
    const { token } = await params;
    await connectToDatabase();
    const job = await ExportJob.findOne({ tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: { $gt: new Date() } }).lean();
    if (!job) return NextResponse.json({ error: "Export not found or expired." }, { status: 404 });
    const client = await Client.findById(job.clientId).select("name").lean();
    const url = await createPrivateObjectUrl(job.objectKey, `client-export-${job.clientId}.zip`, "application/zip");
    await writeAuditEvent({ actor: "admin", action: "client.export.downloaded", resourceType: "client", resourceId: String(job.clientId), resourceLabel: client?.name, requestId: getRequestId(request) });
    return NextResponse.json({ url, expiresAt: job.expiresAt.toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Client export download failed:", error);
    return NextResponse.json({ error: "Unable to access export." }, { status: 500 });
  }
}

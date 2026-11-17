import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const clientSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional().or(z.literal("")),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export async function GET() {
  try {
    await requireAdminSession();
    await connectToDatabase();
    const clients = await Client.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ clients });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Client list failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load clients.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = clientSchema.parse(await request.json());
    await connectToDatabase();
    const client = await Client.create({ ...data, email: data.email || undefined });
    await writeAuditEvent({ actor: "admin", action: "client.created", resourceType: "client", resourceId: String(client._id), resourceLabel: client.name, requestId: getRequestId(request) });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid client details." }, { status: 400 });
    console.error("Client creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to create client.") }, { status: 500 });
  }
}

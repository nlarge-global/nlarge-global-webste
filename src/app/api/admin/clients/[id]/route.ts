import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const clientUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional().or(z.literal("")),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const client = await Client.findById(id).lean();
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const inquiries = await Inquiry.find({ clientId: client._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ client, inquiries });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Client read failed:", error);
    return NextResponse.json({ error: "Unable to load client." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = clientUpdateSchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    const client = await Client.findByIdAndUpdate(id, { ...data, email: data.email || undefined }, { new: true, runValidators: true }).lean();
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "client.updated", resourceType: "client", resourceId: id, requestId: getRequestId(request) });
    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid client details." }, { status: 400 });
    console.error("Client update failed:", error);
    return NextResponse.json({ error: "Unable to update client." }, { status: 500 });
  }
}

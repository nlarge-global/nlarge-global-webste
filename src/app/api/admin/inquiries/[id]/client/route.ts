import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const linkSchema = z.object({ clientId: z.string().regex(/^[a-f\d]{24}$/i).nullable() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = linkSchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    if (data.clientId && !await Client.exists({ _id: data.clientId })) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    inquiry.clientId = data.clientId ? new Types.ObjectId(data.clientId) : undefined;
    await inquiry.save();
    await writeAuditEvent({ actor: "admin", action: data.clientId ? "inquiry.linked" : "inquiry.unlinked", resourceType: "inquiry", resourceId: id, requestId: getRequestId(request), metadata: { clientId: data.clientId } });
    return NextResponse.json({ message: data.clientId ? "Inquiry linked." : "Inquiry unlinked." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid client link." }, { status: 400 });
    console.error("Inquiry client link failed:", error);
    return NextResponse.json({ error: "Unable to update inquiry link." }, { status: 500 });
  }
}

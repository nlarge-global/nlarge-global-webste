import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { ClientDocument } from "@/features/admin/models/document";
import { Project } from "@/features/admin/models/project";
import { PaymentRecord } from "@/features/admin/models/payment";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const paymentSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  method: z.enum(["bank-transfer", "card", "cash", "other"]),
  status: z.enum(["pending", "paid", "partial", "overdue", "cancelled"]),
  utrReference: z.string().trim().max(150).optional(),
  paidAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(3000).optional(),
  proofDocumentId: z.string().trim().min(1).max(64).nullable().optional(),
  projectId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const searchParams = new URL(_request.url).searchParams;
    const projectId = searchParams.get("projectId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    const archive = searchParams.get("archive");
    const includeDeleted = archive === "archived" || archive === "all";
    if (projectId && !await Project.exists({ _id: projectId, clientId: id })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const filter = {
      clientId: id,
      ...(projectId ? { projectId } : {}),
      ...(archive === "active" || !archive ? { deletedAt: { $exists: false } } : {}),
      ...(archive === "archived" ? { deletedAt: { $exists: true } } : {}),
    };
    const [payments, total] = await Promise.all([
      PaymentRecord.find(filter).setOptions({ includeDeleted }).select("amount currency method status paidAt").sort({ paidAt: 1, createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      PaymentRecord.countDocuments(filter).setOptions({ includeDeleted }),
    ]);
    return NextResponse.json({ payments, pagination: { page, limit, total, hasNext: page * limit < total } });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Payment list failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load payments.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = paymentSchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    if (!await Client.exists({ _id: id })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    if (data.projectId && !await Project.exists({ _id: data.projectId, clientId: id })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (data.proofDocumentId && !await ClientDocument.exists({ _id: data.proofDocumentId, clientId: id, ...(data.projectId ? { projectId: data.projectId } : {}) })) return NextResponse.json({ error: "Proof document not found." }, { status: 404 });
    const { proofDocumentId, ...paymentData } = data;
    const payment = await PaymentRecord.create({
      ...paymentData,
      ...(proofDocumentId ? { proofDocumentId } : {}),
      clientId: id,
    });
    await writeAuditEvent({ actor: "admin", action: "payment.created", resourceType: "payment", resourceId: String(payment._id), resourceLabel: `${payment.currency} payment`, requestId: getRequestId(request), metadata: { clientId: id, currency: data.currency, status: data.status } });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
    console.error("Payment creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to save payment.") }, { status: 500 });
  }
}

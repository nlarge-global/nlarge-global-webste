import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { PaymentRecord } from "@/features/admin/models/payment";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const schema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  method: z.enum(["bank-transfer", "card", "cash", "other"]),
  status: z.enum(["pending", "paid", "partial", "overdue", "cancelled"]),
  utrReference: z.string().trim().max(150).optional(),
  milestone: z.string().trim().max(150).optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().trim().max(3000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, paymentId } = await params;
    const data = schema.parse(await request.json());
    await connectToDatabase();
    const payment = await PaymentRecord.findOneAndUpdate({ _id: paymentId, clientId: id }, data, { new: true, runValidators: true }).lean();
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "payment.updated", resourceType: "payment", resourceId: paymentId, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
    console.error("Payment update failed:", error);
    return NextResponse.json({ error: "Unable to update payment." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, paymentId } = await params;
    if (request.headers.get("x-confirm-delete") !== paymentId) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    await connectToDatabase();
    const payment = await PaymentRecord.findOneAndUpdate({ _id: paymentId, clientId: id }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "payment.deleted", resourceType: "payment", resourceId: paymentId, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ message: "Payment deleted." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Payment deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete payment." }, { status: 500 });
  }
}

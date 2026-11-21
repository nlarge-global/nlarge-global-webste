import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { PaymentRecord } from "@/features/admin/models/payment";
import { ClientDocument } from "@/features/admin/models/document";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { getRecordActionMode } from "@/features/admin/services/delete-mode";

const schema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  method: z.enum(["bank-transfer", "card", "cash", "other"]),
  status: z.enum(["pending", "paid", "partial", "overdue", "cancelled"]),
  utrReference: z.string().trim().max(150).optional(),
  paidAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(3000).optional(),
  proofDocumentId: z.string().trim().min(1).max(64).nullable().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    await requireAdminSession();
    const { id, paymentId } = await params;
    await connectToDatabase();
    const payment = await PaymentRecord.findOne({ _id: paymentId, clientId: id })
      .select("amount currency method status paidAt projectId utrReference notes proofDocumentId createdAt updatedAt")
      .lean();
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    return NextResponse.json({ payment }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Payment details failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load payment details.") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, paymentId } = await params;
    const data = schema.parse(await request.json());
    await connectToDatabase();
    const existing = await PaymentRecord.findOne({ _id: paymentId, clientId: id }).select("projectId").lean();
    if (!existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (data.proofDocumentId && !await ClientDocument.exists({
      _id: data.proofDocumentId,
      clientId: id,
      ...(existing.projectId ? { projectId: existing.projectId } : {}),
    })) return NextResponse.json({ error: "Proof document not found." }, { status: 404 });
    const { proofDocumentId, ...paymentData } = data;
    const update =
      proofDocumentId === null
        ? { ...paymentData, $unset: { proofDocumentId: 1 } }
        : {
            ...paymentData,
            ...(proofDocumentId ? { proofDocumentId } : {}),
          };
    const payment = await PaymentRecord.findOneAndUpdate(
      { _id: paymentId, clientId: id },
      update,
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "payment.updated", resourceType: "payment", resourceId: paymentId, resourceLabel: `${payment.currency} payment`, requestId: getRequestId(request), metadata: { clientId: id, currency: payment.currency, status: payment.status } });
    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
    console.error("Payment update failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to update payment.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, paymentId } = await params;
    if (request.headers.get("x-confirm-delete") !== paymentId) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    const mode = getRecordActionMode(request);
    if (!mode) return NextResponse.json({ error: "Choose archive or permanent deletion." }, { status: 400 });
    await connectToDatabase();
    const filter = { _id: paymentId, clientId: id };
    const payment = mode === "restore"
      ? await PaymentRecord.findOneAndUpdate(
          { ...filter, deletedAt: { $exists: true } },
          { $unset: { deletedAt: 1 } },
          { returnDocument: "after" },
        )
      : mode === "permanent"
        ? await PaymentRecord.findOneAndDelete(filter)
        : await PaymentRecord.findOneAndUpdate(
            { ...filter, deletedAt: { $exists: false } },
            { $set: { deletedAt: new Date() } },
            { returnDocument: "after" },
          );
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: mode === "restore" ? "payment.restored" : "payment.deleted", resourceType: "payment", resourceId: paymentId, resourceLabel: `${payment.currency} payment`, requestId: getRequestId(request), metadata: { clientId: id, currency: payment.currency, status: payment.status, [mode === "permanent" ? "permanentDelete" : mode === "restore" ? "restored" : "softDelete"]: true } });
    return NextResponse.json({ message: mode === "permanent" ? "Payment permanently deleted." : mode === "restore" ? "Payment restored." : "Payment archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Payment deletion failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to delete payment.") }, { status: 500 });
  }
}

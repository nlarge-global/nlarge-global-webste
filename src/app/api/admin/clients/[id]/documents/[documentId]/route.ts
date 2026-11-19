import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { ClientDocument } from "@/features/admin/models/document";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { readDocumentContent } from "@/features/admin/services/document-storage";
import { z } from "zod";
import { writeOperationsEvent } from "@/features/admin/services/operations";
import { deletePrivateObject } from "@/lib/r2";
import { getDeleteMode } from "@/features/admin/services/delete-mode";

const updateSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000),
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    await requireAdminSession();
    const { id, documentId } = await params;
    await connectToDatabase();
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get("details") === "true") {
      const details = await ClientDocument.findOne({ _id: documentId, clientId: id })
        .select("filename description tags contentType size createdAt updatedAt")
        .lean();
      if (!details) return NextResponse.json({ error: "Document not found." }, { status: 404 });
      return NextResponse.json({ document: details }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const document = await ClientDocument.findOne({ _id: documentId, clientId: id })
      .select("+encrypted +compression +iv +authTag +keyVersion")
      .lean();
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const clientData = document.encrypted ? await getClientWithKey(id) : null;
    if (document.encrypted && !clientData) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const content = await readDocumentContent(document, clientData?.key);
    await writeAuditEvent({ actor: "admin", action: "document.accessed", resourceType: "document", resourceId: documentId, resourceLabel: document.filename, requestId: getRequestId(request), metadata: { clientId: id } });
    await writeOperationsEvent(request, {
      category: "data-access",
      severity: "high",
      event: "data.document_accessed",
      status: 200,
      resourceType: "document",
      resourceId: documentId,
      message: "Admin opened a private project document.",
    });
    return new NextResponse(new Uint8Array(content), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.filename)}`,
        "Content-Length": String(content.length),
        "Content-Type": document.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Document access failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to create document access.") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, documentId } = await params;
    const formData = await request.formData();
    const data = updateSchema.parse({
      filename: formData.get("filename"),
      description: formData.get("description") ?? "",
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    await connectToDatabase();
    const document = await ClientDocument.findOneAndUpdate(
      { _id: documentId, clientId: id },
      { $set: { ...data, tags: [...new Set(data.tags)] } },
      { returnDocument: "after", runValidators: true },
    ).select("filename description tags contentType size createdAt updatedAt").lean();
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "document.updated", resourceType: "document", resourceId: documentId, resourceLabel: document.filename, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid document details." }, { status: 400 });
    console.error("Document update failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to update document.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, documentId } = await params;
    if (request.headers.get("x-confirm-delete") !== documentId) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    const mode = getDeleteMode(request);
    if (!mode) return NextResponse.json({ error: "Choose archive or permanent deletion." }, { status: 400 });
    await connectToDatabase();
    const document = await ClientDocument.findOne({ _id: documentId, clientId: id });
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (mode === "permanent") {
      await deletePrivateObject(document.objectKey);
      await document.deleteOne();
    } else {
      document.deletedAt = new Date();
      await document.save();
    }
    await writeAuditEvent({ actor: "admin", action: "document.deleted", resourceType: "document", resourceId: documentId, resourceLabel: document.filename, requestId: getRequestId(request), metadata: { clientId: id, [mode === "permanent" ? "permanentDelete" : "softDelete"]: true } });
    return NextResponse.json({ message: mode === "permanent" ? "Document permanently deleted." : "Document archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Document deletion failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to delete document.") }, { status: 500 });
  }
}

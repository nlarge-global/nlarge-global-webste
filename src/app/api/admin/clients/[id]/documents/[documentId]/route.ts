import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { ClientDocument } from "@/features/admin/models/document";
import { connectToDatabase } from "@/lib/mongodb";
import { createPrivateObjectUrl } from "@/lib/r2";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    await requireAdminSession();
    const { id, documentId } = await params;
    await connectToDatabase();
    const document = await ClientDocument.findOne({ _id: documentId, clientId: id }).lean();
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const url = await createPrivateObjectUrl(document.objectKey, document.filename, document.contentType);
    await writeAuditEvent({ actor: "admin", action: "document.accessed", resourceType: "document", resourceId: documentId, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ url, expiresIn: 300 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Document access failed:", error);
    return NextResponse.json({ error: "Unable to create document access." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, documentId } = await params;
    if (request.headers.get("x-confirm-delete") !== documentId) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    await connectToDatabase();
    const document = await ClientDocument.findOne({ _id: documentId, clientId: id });
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    document.deletedAt = new Date();
    await document.save();
    await writeAuditEvent({ actor: "admin", action: "document.deleted", resourceType: "document", resourceId: documentId, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ message: "Document archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Document deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete document." }, { status: 500 });
  }
}

import { getDisplayErrorMessage } from "@/lib/error-message";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { ClientDocument } from "@/features/admin/models/document";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";
import { deletePrivateObject, uploadPrivateObject } from "@/lib/r2";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);

function hasExpectedSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 4)) === "%PDF";
  if (contentType === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const searchParams = new URL(_request.url).searchParams;
    const projectId = searchParams.get("projectId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    if (projectId && !await Project.exists({ _id: projectId, clientId: id })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const filter = { clientId: id, ...(projectId ? { projectId } : {}) };
    const [documents, total] = await Promise.all([
      ClientDocument.find(filter).select("filename description contentType size createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ClientDocument.countDocuments(filter),
    ]);
    return NextResponse.json({ documents, pagination: { page, limit, total, hasNext: page * limit < total } });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Document list failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load documents.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    const formData = await request.formData();
    const projectId = String(formData.get("projectId") || "");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File must be between 1 byte and 10 MB." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Only PDF, PNG, and JPEG files are supported." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedSignature(bytes, file.type)) return NextResponse.json({ error: "File signature does not match its type." }, { status: 400 });
    await connectToDatabase();
    if (!await Client.exists({ _id: id })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    if (projectId && !await Project.exists({ _id: projectId, clientId: id })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const documentId = crypto.randomUUID();
    const safeFilename = String(formData.get("filename") || file.name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 150) || "document";
    const description = String(formData.get("description") || "").trim().slice(0, 1000);
    const objectKey = `clients/${id}/documents/${documentId}/${safeFilename}`;
    await uploadPrivateObject(objectKey, bytes, file.type);
    try {
      const document = await ClientDocument.create({ _id: documentId, clientId: id, projectId: projectId || undefined, filename: safeFilename, description, objectKey, contentType: file.type, size: file.size });
      await writeAuditEvent({ actor: "admin", action: "document.uploaded", resourceType: "document", resourceId: documentId, resourceLabel: document.filename, requestId: getRequestId(request), metadata: { clientId: id, contentType: file.type, size: file.size } });
      return NextResponse.json({ document: { _id: document._id, filename: document.filename, description: document.description, contentType: document.contentType, size: document.size, createdAt: document.createdAt } }, { status: 201 });
    } catch (error) {
      console.error("Document metadata save failed after upload:", error);
      try {
        await deletePrivateObject(objectKey);
      } catch (cleanupError) {
        console.error("Document orphan cleanup failed:", cleanupError);
      }
      return NextResponse.json({ error: getDisplayErrorMessage(error, "Document metadata could not be saved.") }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Document upload failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to upload document.") }, { status: 500 });
  }
}

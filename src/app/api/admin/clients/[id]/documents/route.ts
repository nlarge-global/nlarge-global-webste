import { getDisplayErrorMessage } from "@/lib/error-message";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { ClientDocument } from "@/features/admin/models/document";
import { Project } from "@/features/admin/models/project";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { connectToDatabase } from "@/lib/mongodb";
import { deletePrivateObject, uploadPrivateObject } from "@/lib/r2";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import {
  documentUploadConfig,
  getDocumentType,
} from "@/features/admin/services/document-upload-config";
import { prepareDocumentContent } from "@/features/admin/services/document-storage";

function hasExpectedSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 4)) === "%PDF";
  if (contentType === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "application/zip") {
    return bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]) && [0x04, 0x06, 0x08].includes(bytes[3]);
  }
  if (contentType === "text/plain") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return !bytes.includes(0);
    } catch {
      return false;
    }
  }
  return false;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const searchParams = new URL(_request.url).searchParams;
    const projectId = searchParams.get("projectId");
    const referencesOnly = searchParams.get("referencesOnly") === "true";
    const details = searchParams.get("details") === "true";
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
    const [documents, total] = await Promise.all([
      ClientDocument.find(filter).setOptions({ includeDeleted })
        .select(referencesOnly ? "filename" : details
          ? "filename description tags contentType size createdAt updatedAt"
          : "filename contentType createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ClientDocument.countDocuments(filter).setOptions({ includeDeleted }),
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
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a non-empty PDF, PNG, JPEG, ZIP, or TXT file." }, { status: 400 });
    const contentType = getDocumentType(file);
    if (!contentType) return NextResponse.json({ error: "Only PDF, PNG, JPEG, ZIP, and TXT files are supported." }, { status: 400 });
    const { maxSize } = documentUploadConfig[contentType];
    if (file.size > maxSize) return NextResponse.json({ error: `${file.name}: larger than ${documentUploadConfig[contentType].label} limit of ${Math.ceil(maxSize / (1024 * 1024))} MB.` }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedSignature(bytes, contentType)) return NextResponse.json({ error: `${file.name}: file contents do not match its ${documentUploadConfig[contentType].label} type.` }, { status: 400 });
    await connectToDatabase();
    if (!await Client.exists({ _id: id })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    if (projectId && !await Project.exists({ _id: projectId, clientId: id })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const clientData = await getClientWithKey(id);
    if (!clientData) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const documentId = crypto.randomUUID();
    const safeFilename = String(formData.get("filename") || file.name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 150) || "document";
    const description = String(formData.get("description") || "").trim().slice(0, 1000);
    const tags = [
      ...new Set(
        String(formData.get("tags") || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
    if (tags.length > 20 || tags.some((tag) => tag.length > 50)) {
      return NextResponse.json({ error: "Use up to 20 tags, each no longer than 50 characters." }, { status: 400 });
    }
    const objectKey = `clients/${id}/documents/${documentId}/${safeFilename}`;
    const encryptedContent = await prepareDocumentContent(
      bytes,
      contentType,
      clientData.key,
    );
    await uploadPrivateObject(objectKey, encryptedContent.ciphertext, "application/octet-stream");
    try {
      const document = await ClientDocument.create({
        _id: documentId,
        clientId: id,
        projectId: projectId || undefined,
        filename: safeFilename,
        description,
        tags,
        objectKey,
        contentType,
        size: file.size,
        encrypted: true,
        compression: encryptedContent.compression,
        iv: encryptedContent.iv,
        authTag: encryptedContent.authTag,
        keyVersion: clientData.client.dataKeyVersion ?? "v1",
      });
      await writeAuditEvent({ actor: "admin", action: "document.uploaded", resourceType: "document", resourceId: documentId, resourceLabel: document.filename, requestId: getRequestId(request), metadata: { clientId: id, contentType, size: file.size } });
      return NextResponse.json({ document: { _id: document._id, filename: document.filename, contentType: document.contentType, createdAt: document.createdAt } }, { status: 201 });
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

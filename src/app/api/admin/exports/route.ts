import crypto from "node:crypto";
import * as archiver from "archiver";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { Client } from "@/features/admin/models/client";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { ClientDocument } from "@/features/admin/models/document";
import { ExportJob } from "@/features/admin/models/export-job";
import { Inquiry } from "@/features/admin/models/inquiry";
import { PaymentRecord } from "@/features/admin/models/payment";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { downloadPrivateObject, uploadPrivateObject } from "@/lib/r2";

const exportSchema = z.object({
  clientId: z.string().regex(/^[a-f\d]{24}$/i),
  includeDocuments: z.boolean().default(false),
});

function createZip(files: Array<{ name: string; content: string | Buffer }>) {
  return new Promise<Buffer>((resolve, reject) => {
    const output: Buffer[] = [];
    const archive = new archiver.ZipArchive({ zlib: { level: 6 } });
    archive.on("data", (chunk: Buffer) => output.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(output)));
    for (const file of files) archive.append(file.content, { name: file.name });
    void archive.finalize();
  });
}

function isMissingPrivateObject(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const storageError = error as { name?: string; Code?: string; code?: string };
  return storageError.name === "NoSuchKey" || storageError.Code === "NoSuchKey" || storageError.code === "NoSuchKey";
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = exportSchema.parse(await request.json());
    await connectToDatabase();
    const client = await Client.findById(data.clientId).lean();
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const [inquiries, projects, tasks, payments, documents] = await Promise.all([
      Inquiry.find({ clientId: client._id }).lean(),
      Project.find({ clientId: client._id }).lean(),
      Task.find({ clientId: client._id }).lean(),
      PaymentRecord.find({ clientId: client._id }).lean(),
      ClientDocument.find({ clientId: client._id }).select("filename contentType size createdAt objectKey").lean(),
    ]);
    const inquiryIds = inquiries.map((inquiry) => inquiry._id);
    const conversations = await ConversationEntry.find({ inquiryId: { $in: inquiryIds } }).lean();
    const files: Array<{ name: string; content: string | Buffer }> = [
      { name: "client.json", content: JSON.stringify(client, null, 2) },
      { name: "inquiries.json", content: JSON.stringify(inquiries, null, 2) },
      { name: "projects.json", content: JSON.stringify(projects, null, 2) },
      { name: "tasks.json", content: JSON.stringify(tasks, null, 2) },
      { name: "payments.json", content: JSON.stringify(payments, null, 2) },
      { name: "conversations.json", content: JSON.stringify(conversations, null, 2) },
      { name: "documents.json", content: JSON.stringify(documents.map(({ objectKey: _objectKey, ...metadata }) => metadata), null, 2) },
    ];
    const unavailableDocuments: string[] = [];
    if (data.includeDocuments) {
      for (const document of documents) {
        try {
          files.push({
            name: `documents/${document.filename}`,
            content: await downloadPrivateObject(document.objectKey),
          });
        } catch (error) {
          if (!isMissingPrivateObject(error)) throw error;
          unavailableDocuments.push(document.filename);
        }
      }
      if (unavailableDocuments.length > 0) {
        files.push({
          name: "documents-unavailable.json",
          content: JSON.stringify(
            {
              message: "These document records had no matching file in private storage and were not included.",
              filenames: unavailableDocuments,
            },
            null,
            2,
          ),
        });
      }
    }
    const zip = await createZip(files);
    const token = crypto.randomBytes(32).toString("base64url");
    const exportId = crypto.randomUUID();
    const objectKey = `exports/${exportId}.zip`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await uploadPrivateObject(objectKey, zip, "application/zip");
    await ExportJob.create({ clientId: client._id, tokenHash: crypto.createHash("sha256").update(token).digest("hex"), objectKey, expiresAt });
    await writeAuditEvent({ actor: "admin", action: "client.export.created", resourceType: "client", resourceId: data.clientId, requestId: getRequestId(request), metadata: { includeDocuments: data.includeDocuments } });
    return NextResponse.json({
      downloadUrl: `/api/admin/exports/${token}`,
      expiresAt: expiresAt.toISOString(),
      unavailableDocuments,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid export options." }, { status: 400 });
    console.error("Client export failed:", error);
    return NextResponse.json({ error: "Unable to create export." }, { status: 500 });
  }
}

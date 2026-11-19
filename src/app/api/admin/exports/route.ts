import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { Client, type ClientDocument as ClientRecord } from "@/features/admin/models/client";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { ClientDocument } from "@/features/admin/models/document";
import { Inquiry } from "@/features/admin/models/inquiry";
import { OperationsEvent } from "@/features/admin/models/operations-event";
import { PaymentRecord } from "@/features/admin/models/payment";
import { Project } from "@/features/admin/models/project";
import { Prospect } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { Task } from "@/features/admin/models/task";
import { Subscriber } from "@/features/contact/models/subscriber";
import { createUnsubscribeToken } from "@/features/contact/services/unsubscribe-token";
import {
  getRequestId,
  sanitizeAuditLabel,
  sanitizeAuditMetadata,
  writeAuditEvent,
} from "@/features/admin/services/audit";
import {
  createEncryptedZipStream,
  generateExportPassword,
  parseExportDateRange,
  type ExportType,
} from "@/features/admin/services/export-archive";
import {
  operationsErrorResponse,
  writeOperationsEvent,
} from "@/features/admin/services/operations";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { readDocumentContent } from "@/features/admin/services/document-storage";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

const exportTypes = [
  "client",
  "prospects",
  "subscribers",
  "inquiries",
  "audit",
  "operations",
] as const satisfies readonly ExportType[];

const exportSchema = z.object({
  exportType: z.enum(exportTypes),
  clientId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  includeDocuments: z.boolean().default(false),
  from: z.string().optional(),
  to: z.string().optional(),
}).superRefine((data, context) => {
  if (data.exportType === "client" && !data.clientId) {
    context.addIssue({
      code: "custom",
      path: ["clientId"],
      message: "Choose a client.",
    });
  }
  if (data.exportType !== "client" && data.includeDocuments) {
    context.addIssue({
      code: "custom",
      path: ["includeDocuments"],
      message: "Documents can only be included in client exports.",
    });
  }
  if (
    (data.exportType === "audit" || data.exportType === "operations") &&
    (!data.from || !data.to)
  ) {
    context.addIssue({
      code: "custom",
      path: ["from"],
      message: "Choose a start and end date for log exports.",
    });
  }
});

type ExportCursor<T> = AsyncIterable<T> & {
  close: () => Promise<unknown>;
};

function textStream(chunks: AsyncIterable<string>) {
  const iterator = chunks[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await iterator.next();
        if (result.done) controller.close();
        else controller.enqueue(encoder.encode(result.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}

async function* jsonArray<T>(
  cursor: ExportCursor<T>,
  transform: (record: T) => unknown = (record) => record,
) {
  let first = true;
  try {
    yield "[";
    for await (const record of cursor) {
      yield `${first ? "" : ","}\n${JSON.stringify(transform(record))}`;
      first = false;
    }
    yield "\n]";
  } finally {
    await cursor.close();
  }
}

async function addJsonEntry<T>(
  archive: ReturnType<typeof createEncryptedZipStream>,
  name: string,
  cursor: ExportCursor<T>,
  transform?: (record: T) => unknown,
) {
  await archive.add(name, textStream(jsonArray(cursor, transform)));
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function safeFilename(value: string) {
  const basename = value.replaceAll("\\", "/").split("/").at(-1) ?? "";
  const safe = basename
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_")
    .trim()
    .replace(/[. ]+$/g, "");
  return safe && safe !== "." && safe !== ".." ? safe : "document";
}

function exportFilename(type: ExportType, clientName?: string) {
  const clientSlug = clientName
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const name = type === "client" ? `client-${clientSlug || "records"}` : type;
  return `nlarge-${name}-${new Date().toISOString().slice(0, 10)}.zip`;
}

async function addClientExport(
  archive: ReturnType<typeof createEncryptedZipStream>,
  client: ClientRecord,
  includeDocuments: boolean,
  clientKey?: Buffer,
) {
  await archive.add(
    "client.json",
    new Blob([JSON.stringify(client, null, 2)]).stream(),
  );
  const linked = { clientId: client._id };
  const includeDeleted = { includeDeleted: true };

  await addJsonEntry(
    archive,
    "projects.json",
    Project.find(linked)
      .setOptions(includeDeleted)
      .select("name status technicalDetails deliveryDetails repositoryUrl environment productionUrl stagingUrl deadline deliveredAt notes createdAt updatedAt deletedAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
  await addJsonEntry(
    archive,
    "tasks.json",
    Task.find(linked)
      .setOptions(includeDeleted)
      .select("projectId title status dueDate priority notes completedAt createdAt updatedAt deletedAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
  await addJsonEntry(
    archive,
    "payments.json",
    PaymentRecord.find(linked)
      .setOptions(includeDeleted)
      .select("projectId amount currency method status utrReference paidAt notes proofDocumentId createdAt updatedAt deletedAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
  await addJsonEntry(
    archive,
    "inquiries.json",
    Inquiry.find(linked)
      .setOptions(includeDeleted)
      .select("name email queryType subject message privacyAcknowledgement marketingConsent marketingSubscriptionRecordedAt consent origin source status priority tags nextAction followUpAt clientId createdAt updatedAt deletedAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
  await addJsonEntry(
    archive,
    "conversations.json",
    Inquiry.aggregate([
      { $match: { clientId: client._id } },
      {
        $lookup: {
          from: ConversationEntry.collection.name,
          localField: "_id",
          foreignField: "inquiryId",
          as: "entries",
        },
      },
      { $unwind: "$entries" },
      { $replaceRoot: { newRoot: "$entries" } },
      {
        $project: {
          _id: 1,
          inquiryId: 1,
          channel: 1,
          direction: 1,
          content: 1,
          occurredAt: 1,
          createdAt: 1,
          updatedAt: 1,
          deletedAt: 1,
        },
      },
      { $sort: { occurredAt: 1, _id: 1 } },
    ]).cursor({ batchSize: 100 }),
  );

  const documentFilter = { clientId: client._id };
  const metadataCursor = ClientDocument.find(documentFilter)
    .setOptions(includeDeleted)
    .select("filename contentType size tags description createdAt updatedAt deletedAt")
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .cursor({ batchSize: 100 });
  await addJsonEntry(archive, "documents.json", metadataCursor);

  if (!includeDocuments) return;

  const documentsCursor = ClientDocument.find(documentFilter)
    .setOptions(includeDeleted)
    .select("filename objectKey +encrypted +compression +iv +authTag +keyVersion")
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .cursor({ batchSize: 1 });
  const unavailable: string[] = [];
  try {
    for await (const document of documentsCursor) {
      try {
        const content = await readDocumentContent(document, clientKey);
        await archive.add(
          `documents/${document._id}-${safeFilename(document.filename)}`,
          new Blob([new Uint8Array(content)]).stream(),
        );
      } catch (error) {
        if (!isMissingPrivateObject(error)) throw error;
        unavailable.push(document.filename);
      }
    }
  } finally {
    await documentsCursor.close();
  }
  if (unavailable.length) {
    await archive.add(
      "documents-unavailable.json",
      new Blob([JSON.stringify({
        message: "These document records had no matching file in private storage.",
        filenames: unavailable,
      }, null, 2)]).stream(),
    );
  }
}

function isMissingPrivateObject(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const storageError = error as { name?: string; Code?: string; code?: string };
  return (
    storageError.name === "NoSuchKey" ||
    storageError.Code === "NoSuchKey" ||
    storageError.code === "NoSuchKey"
  );
}

async function addSubscribersExport(archive: ReturnType<typeof createEncryptedZipStream>) {
  async function* rows() {
    yield "\uFEFFemail,status,consent_history,unsubscribe_url";
    const cursor = Subscriber.find({ status: "subscribed" })
      .select("email status unsubscribeKey consentEvents")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 });
    try {
      for await (const subscriber of cursor) {
        const unsubscribeUrl = new URL("/unsubscribe", siteUrl);
        unsubscribeUrl.searchParams.set(
          "token",
          createUnsubscribeToken(subscriber.unsubscribeKey),
        );
        const consentHistory = subscriber.consentEvents.map(
          ({ action, version, text, occurredAt, source }) => ({
            action,
            version,
            text,
            occurredAt,
            source,
          }),
        );
        yield `\r\n${[
          subscriber.email,
          subscriber.status,
          JSON.stringify(consentHistory),
          unsubscribeUrl.toString(),
        ].map(csvCell).join(",")}`;
      }
    } finally {
      await cursor.close();
    }
  }
  await archive.add("nlarge-subscribers.csv", textStream(rows()));
}

async function addProspectsExport(archive: ReturnType<typeof createEncryptedZipStream>) {
  await addJsonEntry(
    archive,
    "prospects.json",
    Prospect.find()
      .setOptions({ includeDeleted: true })
      .select("name url source notes status nextAction followUpAt createdAt updatedAt deletedAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
  await addJsonEntry(
    archive,
    "prospect-activities.json",
    ProspectActivity.find()
      .select("prospectId type content occurredAt createdAt")
      .sort({ occurredAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
}

async function addInquiriesExport(archive: ReturnType<typeof createEncryptedZipStream>) {
  await addJsonEntry(
    archive,
    "inquiries.json",
    Inquiry.find()
      .setOptions({ includeDeleted: true })
      .select("name email queryType subject message privacyAcknowledgement marketingConsent marketingSubscriptionRecordedAt consent origin source status priority tags nextAction followUpAt clientId createdAt updatedAt deletedAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
  await addJsonEntry(
    archive,
    "conversation-entries.json",
    ConversationEntry.find()
      .setOptions({ includeDeleted: true })
      .select("inquiryId channel direction content occurredAt createdAt updatedAt deletedAt")
      .sort({ occurredAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
}

async function addLogExport(
  archive: ReturnType<typeof createEncryptedZipStream>,
  type: "audit" | "operations",
  dateRange: { $gte: Date; $lt: Date },
  requestId: string,
) {
  if (type === "audit") {
    await addJsonEntry(
      archive,
      "audit-events.json",
      AuditEvent.find({ createdAt: dateRange, requestId: { $ne: requestId } })
        .select("actor action resourceType resourceId resourceLabel requestId metadata createdAt")
        .sort({ createdAt: 1, _id: 1 })
        .lean()
        .cursor({ batchSize: 100 }),
      (record) => ({
        ...record,
        resourceLabel: sanitizeAuditLabel(record.resourceLabel),
        metadata: sanitizeAuditMetadata(record.metadata),
      }),
    );
    return;
  }
  await addJsonEntry(
    archive,
    "operations-events.json",
    OperationsEvent.find({ createdAt: dateRange })
      .select("category severity event source route method status resourceType resourceId recordCount message errorName stack requestId ipAddress userAgent occurrences lastSeenAt createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .cursor({ batchSize: 100 }),
  );
}

function exportContents(type: ExportType) {
  const contents: Record<ExportType, string> = {
    client: "Client profile, linked projects, tasks, payments, inquiries, conversation history, and document metadata. Credentials are excluded. Missing private files, if any, are listed in documents-unavailable.json.",
    prospects: "Prospect records, notes, follow-up details, and prospect activity history.",
    subscribers: "Subscribed email addresses, consent evidence, and signed unsubscribe links.",
    inquiries: "Inquiry records, consent evidence, and conversation entries.",
    audit: "Audit events for the selected date range. Sensitive metadata is filtered before export.",
    operations: "Operational events for the selected date range, including technical and request context.",
  };
  return `NLarge Global data export\n\n${contents[type]}\n\nThis archive uses AES-256 encryption for file contents. Entry names and archive metadata are not encrypted. Use a current ZIP tool that supports WinZip AES-256, such as 7-Zip or WinZip. The password is shown once in the dashboard and is not stored.`;
}

function readableExportType(type: ExportType) {
  return type === "client" ? "client" : type;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = exportSchema.parse(await request.json());
    await connectToDatabase();

    let client: ClientRecord | null = null;
    if (data.exportType === "client") {
      client = await Client.findById(data.clientId)
        .setOptions({ includeDeleted: true })
        .select(
          "_id name email company phone notes tags createdAt updatedAt deletedAt",
        );
      if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    let dateRange: { $gte: Date; $lt: Date } | undefined;
    if (data.exportType === "audit" || data.exportType === "operations") {
      dateRange = parseExportDateRange(
        data.from!,
        data.to!,
        data.exportType === "operations" ? 10 : 30,
      ) ?? undefined;
      if (!dateRange) {
        return NextResponse.json({
          error: data.exportType === "operations"
            ? "Choose a valid date range of up to 10 days."
            : "Choose a valid date range of up to 30 days.",
        }, { status: 400 });
      }
    }

    let clientKey: Buffer | undefined;
    if (data.exportType === "client" && data.includeDocuments) {
      const encryptedDocument = await ClientDocument.findOne({
        clientId: client!._id,
        encrypted: true,
      })
        .setOptions({ includeDeleted: true })
        .select("_id")
        .lean();
      if (encryptedDocument) {
        const clientData = await getClientWithKey(String(client!._id), true);
        if (!clientData) {
          throw new Error("Client encryption key is unavailable.");
        }
        clientKey = clientData.key;
      }
    }

    const requestId = getRequestId(request);
    await writeAuditEvent({
      actor: "admin",
      action: `${readableExportType(data.exportType)}.export.started`,
      resourceType: data.exportType,
      ...(client ? { resourceId: String(client._id), resourceLabel: client.name } : {}),
      requestId,
      metadata: {
        type: data.exportType,
        ...(data.exportType === "client" ? { includeDocuments: data.includeDocuments } : {}),
        ...(data.from ? { from: data.from } : {}),
        ...(data.to ? { to: data.to } : {}),
      },
    });

    const password = generateExportPassword();
    const archive = createEncryptedZipStream(password);
    const filename = exportFilename(data.exportType, client?.name);

    void (async () => {
      try {
        await archive.add("README.txt", new Blob([exportContents(data.exportType)]).stream());
        if (client) {
          await addClientExport(archive, client, data.includeDocuments, clientKey);
        } else if (data.exportType === "prospects") {
          await addProspectsExport(archive);
        } else if (data.exportType === "subscribers") {
          await addSubscribersExport(archive);
        } else if (data.exportType === "inquiries") {
          await addInquiriesExport(archive);
        } else if (data.exportType === "audit" || data.exportType === "operations") {
          await addLogExport(archive, data.exportType, dateRange!, requestId);
        }
        await archive.close();
        try {
          await writeAuditEvent({
            actor: "admin",
            action: `${readableExportType(data.exportType)}.export.completed`,
            resourceType: data.exportType,
            ...(client ? { resourceId: String(client._id), resourceLabel: client.name } : {}),
            requestId,
            metadata: {
              type: data.exportType,
              ...(data.exportType === "client" ? { includeDocuments: data.includeDocuments } : {}),
              ...(data.from ? { from: data.from } : {}),
              ...(data.to ? { to: data.to } : {}),
            },
          });
        } catch (error) {
          console.error("Completed export could not be recorded in the audit log:", error);
          await writeOperationsEvent(request, {
            category: "data-access",
            severity: "high",
            event: "admin.export.audit_log_failed",
            status: 500,
            resourceType: data.exportType,
            resourceId: client ? String(client._id) : undefined,
            message: "An export completed, but its audit event could not be recorded.",
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
        }
      } catch (error) {
        console.error("Encrypted export stream failed:", error);
        try {
          archive.fail(error);
        } catch (streamError) {
          console.error("Unable to close failed export stream:", streamError);
        }
        try {
          await writeOperationsEvent(request, {
            category: "data-access",
            severity: "high",
            event: "admin.export.stream_failed",
            status: 500,
            resourceType: data.exportType,
            resourceId: client ? String(client._id) : undefined,
            message: "An encrypted data export failed while streaming.",
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
        } catch (loggingError) {
          console.error("Unable to record export stream failure:", loggingError);
        }
      }
    })();

    return new NextResponse(archive.readable, {
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/zip",
        "X-Content-Type-Options": "nosniff",
        "X-Export-Password": password,
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json(
        { error: "Security check failed. Refresh and try again." },
        { status: 403 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid export options." }, { status: 400 });
    }
    console.error("Data export failed:", error);
    return operationsErrorResponse(request, error, "Unable to create export.");
  }
}

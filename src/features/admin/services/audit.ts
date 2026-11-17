import crypto from "node:crypto";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { connectToDatabase } from "@/lib/mongodb";

type AuditMetadata = Record<string, string | number | boolean | null>;

const safeMetadataKeys = new Set([
  "cascade",
  "channel",
  "clientId",
  "contentType",
  "currency",
  "diagnosticStage",
  "diagnosticResult",
  "failureReason",
  "direction",
  "failureKind",
  "fetchDest",
  "fetchMode",
  "fetchSite",
  "includeDocuments",
  "originMatches",
  "originPresent",
  "priority",
  "projectId",
  "sessionValid",
  "shareCookiePresent",
  "shareNavigation",
  "contentTypeValid",
  "titleFieldType",
  "textFieldType",
  "urlFieldType",
  "size",
  "softDelete",
  "source",
  "status",
  "type",
  "updated",
  "adminCookiePresent",
]);

export function sanitizeAuditLabel(value: unknown) {
  if (typeof value !== "string") return undefined;
  const label = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return label ? label.slice(0, 200) : undefined;
}

export function sanitizeAuditMetadata(metadata: unknown = {}): AuditMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const safeMetadata: AuditMetadata = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (!safeMetadataKeys.has(key)) continue;
    if (typeof value === "string") {
      const safeValue = sanitizeAuditLabel(value);
      if (safeValue) safeMetadata[key] = safeValue.slice(0, 200);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      safeMetadata[key] = value;
    } else if (typeof value === "boolean") {
      safeMetadata[key] = value;
    }
  }
  return safeMetadata;
}

export function getRequestId(request: Request) {
  const requestId = request.headers.get("x-request-id");
  return requestId && /^[a-zA-Z0-9._:-]{1,100}$/.test(requestId)
    ? requestId
    : crypto.randomUUID();
}

export async function writeAuditEvent(event: {
  actor: "admin" | "public";
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceLabel?: string;
  requestId: string;
  metadata?: AuditMetadata;
}) {
  await connectToDatabase();
  await AuditEvent.create({
    ...event,
    resourceLabel: sanitizeAuditLabel(event.resourceLabel),
    metadata: sanitizeAuditMetadata(event.metadata),
  });
}

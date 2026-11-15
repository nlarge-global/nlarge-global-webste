import crypto from "node:crypto";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { connectToDatabase } from "@/lib/mongodb";

type AuditMetadata = Record<string, string | number | boolean | null>;

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id")?.slice(0, 100) || crypto.randomUUID();
}

export async function writeAuditEvent(event: {
  actor: "admin" | "public";
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId: string;
  metadata?: AuditMetadata;
}) {
  await connectToDatabase();
  await AuditEvent.create({ ...event, metadata: event.metadata ?? {} });
}

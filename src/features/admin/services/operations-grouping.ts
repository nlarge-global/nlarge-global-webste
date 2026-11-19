import { createHash } from "node:crypto";
import type { OperationCategory, OperationSeverity } from "./operations-types";

export const OPERATIONS_GROUP_WINDOW_MS = 15 * 60 * 1000;

type OperationsGroupIdentity = {
  category: OperationCategory;
  severity: OperationSeverity;
  event: string;
  source: "server" | "client";
  route: string;
  method: string;
  status?: number;
  resourceType?: string;
  resourceId?: string;
  message: string;
  errorName?: string;
  ipAddress: string;
  userAgent: string;
};

export function shouldGroupOperationsEvent(
  category: OperationCategory,
  source: "server" | "client",
  status?: number,
) {
  return (category === "security" && status !== 200)
    || source === "client"
    || (status !== undefined && status >= 400);
}

export function getOperationsGroupKey(identity: OperationsGroupIdentity) {
  const signature = [
    identity.category,
    identity.severity,
    identity.event,
    identity.source,
    identity.route,
    identity.method,
    identity.status,
    identity.resourceType,
    identity.resourceId,
    identity.message,
    identity.errorName,
    identity.category === "security" ? identity.ipAddress : "",
    identity.category === "security" ? identity.userAgent : "",
  ];
  return createHash("sha256").update(JSON.stringify(signature)).digest("hex");
}

export function getOperationsGroupBucket(date: Date) {
  return new Date(
    Math.floor(date.getTime() / OPERATIONS_GROUP_WINDOW_MS) * OPERATIONS_GROUP_WINDOW_MS,
  );
}

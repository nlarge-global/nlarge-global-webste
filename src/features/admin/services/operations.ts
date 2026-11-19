import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { getRequestId } from "@/features/admin/services/audit";
import {
  OperationsEvent,
  type OperationCategory,
  type OperationSeverity,
} from "@/features/admin/models/operations-event";
import { connectToDatabase } from "@/lib/mongodb";
import { sanitizeOperationsText } from "@/features/admin/services/operations-redaction";
import {
  getOperationsGroupBucket,
  getOperationsGroupKey,
  shouldGroupOperationsEvent,
} from "@/features/admin/services/operations-grouping";

type EventInput = {
  category: OperationCategory;
  severity: OperationSeverity;
  event: string;
  source?: "server" | "client";
  route?: string;
  method?: string;
  status?: number;
  resourceType?: string;
  resourceId?: string;
  recordCount?: number;
  message: string;
  errorName?: string;
  stack?: string;
  ipAddress?: string;
};

type PersistedEvent = {
  category: OperationCategory;
  severity: OperationSeverity;
  event: string;
  source: "server" | "client";
  route: string;
  method: string;
  status?: number;
  resourceType?: string;
  resourceId?: string;
  recordCount?: number;
  message: string;
  errorName?: string;
  stack?: string;
  requestId: string;
  ipAddress: string;
  userAgent: string;
};

function requestIp(request: Request) {
  const forwardedIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwardedIp && isIP(forwardedIp) ? forwardedIp : "unknown";
}

async function persistOperationsEvent(data: PersistedEvent, now = new Date()) {
  if (!shouldGroupOperationsEvent(data.category, data.source, data.status)) {
    await OperationsEvent.create({ ...data, occurrences: 1, lastSeenAt: now });
    return;
  }

  const groupBucket = getOperationsGroupBucket(now);
  const groupKey = getOperationsGroupKey(data);
  const filter = { groupKey, groupBucket };
  try {
    await OperationsEvent.updateOne(filter, {
      $setOnInsert: { ...data, groupKey, groupBucket, occurrences: 0, createdAt: now },
      $set: { lastSeenAt: now },
      $inc: { occurrences: 1 },
    }, { upsert: true });
  } catch (error) {
    if (
      typeof error !== "object"
      || error === null
      || !("code" in error)
      || error.code !== 11000
    ) {
      throw error;
    }
    await OperationsEvent.updateOne(filter, {
      $set: { lastSeenAt: now },
      $inc: { occurrences: 1 },
    });
  }
}

export async function writeOperationsEvent(request: Request, event: EventInput) {
  const requestId = getRequestId(request);
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const now = new Date();
    const data: PersistedEvent = {
      category: event.category,
      severity: event.severity,
      event: event.event.slice(0, 100),
      source: event.source ?? "server",
      route: (event.route ?? url.pathname).slice(0, 200),
      method: (event.method ?? request.method).slice(0, 10),
      status: event.status,
      resourceType: event.resourceType?.slice(0, 100),
      resourceId: event.resourceId?.slice(0, 100),
      recordCount: event.recordCount,
      message: sanitizeOperationsText(event.message),
      errorName: event.errorName?.slice(0, 100),
      stack: event.stack ? sanitizeOperationsText(event.stack) : undefined,
      requestId,
      ipAddress: event.ipAddress ?? requestIp(request),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "unknown",
    };
    await persistOperationsEvent(data, now);
  } catch (loggingError) {
    console.error("Operational event could not be persisted:", {
      requestId,
      category: event.category,
      event: event.event,
      errorName: loggingError instanceof Error ? loggingError.name : "UnknownError",
    });
  }
  return requestId;
}

function categoryFor(request: Request): OperationCategory {
  return categoryForRoute(new URL(request.url).pathname, request.method);
}

function categoryForRoute(path: string, method: string): OperationCategory {
  if (
    /\/(exports|subscribers\/export)/.test(path) ||
    (method === "GET" && /\/documents\/[^/]+$|\/secrets\/[^/]+\/reveal$/.test(path))
  ) {
    return "data-access";
  }
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) return "data-integrity";
  return "availability";
}

export async function operationsErrorResponse(
  request: Request,
  error: unknown,
  fallback: string,
) {
  const category = categoryFor(request);
  const requestId = await writeOperationsEvent(request, {
    category,
    severity: category === "data-access" ? "high" : "medium",
    event: "admin.action.failed",
    status: 500,
    message: error instanceof Error ? error.message : "Unexpected server error",
    errorName: error instanceof Error ? error.name : "UnknownError",
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json(
    { error: `${fallback} Reference: ${requestId}`, referenceId: requestId },
    { status: 500 },
  );
}

export function getOperationsClientIp(request: Request) {
  return requestIp(request);
}

export async function writeSecurityEvent(
  request: Request,
  input: {
    event: string;
    severity: OperationSeverity;
    message: string;
    ipAddress?: string;
    status?: number;
  },
) {
  const requestId = getRequestId(request);
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const data: PersistedEvent = {
      category: "security",
      severity: input.severity,
      event: input.event.slice(0, 100),
      source: "server",
      route: url.pathname.slice(0, 200),
      method: request.method.slice(0, 10),
      status: input.status ?? (input.event.includes("rate_limited") ? 429 : 401),
      message: sanitizeOperationsText(input.message),
      requestId,
      ipAddress: input.ipAddress ?? requestIp(request),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "unknown",
    };
    await persistOperationsEvent(data);
  } catch (error) {
    console.error("Security event could not be persisted:", {
      requestId,
      event: input.event,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }
  return requestId;
}

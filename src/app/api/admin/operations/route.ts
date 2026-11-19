import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCurrentAdminSession,
  requireAdminSession,
  validateCsrfToken,
} from "@/features/admin/auth/session";
import {
  operationCategories,
  operationSeverities,
  OperationsEvent,
} from "@/features/admin/models/operations-event";
import { writeOperationsEvent } from "@/features/admin/services/operations";
import type {
  OperationCategory,
  OperationSeverity,
} from "@/features/admin/services/operations-types";
import { connectToDatabase } from "@/lib/mongodb";

const clientEventSchema = z.object({
  event: z.enum([
    "client.window_error",
    "client.unhandled_rejection",
    "client.api_error",
  ]),
  route: z.string().regex(/^\/(?:admin|api\/admin)(?:\/|$)/).max(200),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "CLIENT"]).optional(),
  status: z.number().int().min(100).max(599).optional(),
  message: z.string().min(1).max(1000),
  errorName: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const category = params.get("category");
    const severity = params.get("severity");
    const selectedCategory = operationCategories.find((value) => value === category);
    const selectedSeverity = operationSeverities.find((value) => value === severity);
    const filter: { category?: OperationCategory; severity?: OperationSeverity } = {
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(selectedSeverity ? { severity: selectedSeverity } : {}),
    };
    await connectToDatabase();
    const [events, total, priorityCounts] = await Promise.all([
      OperationsEvent.aggregate([
        { $match: filter },
        {
          $addFields: {
            severityPriority: {
              $switch: {
                branches: [
                  { case: { $eq: ["$severity", "critical"] }, then: 0 },
                  { case: { $eq: ["$severity", "high"] }, then: 1 },
                  { case: { $eq: ["$severity", "medium"] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
        { $sort: { severityPriority: 1, createdAt: -1 } },
        { $skip: (page - 1) * 25 },
        { $limit: 25 },
        { $project: { severityPriority: 0, groupKey: 0, groupBucket: 0, __v: 0 } },
      ]),
      OperationsEvent.countDocuments(filter),
      OperationsEvent.aggregate([
        {
          $group: {
            _id: "$severity",
            count: { $sum: { $ifNull: ["$occurrences", 1] } },
          },
        },
      ]),
    ]);
    return NextResponse.json({
      events,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / 25)),
      priorityCounts: Object.fromEntries(
        priorityCounts.map(({ _id, count }) => [_id, count]),
      ),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Operations log read failed:", error);
    return NextResponse.json({ error: "Unable to load operations logs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await validateCsrfToken(request, session);
    const data = clientEventSchema.parse(await request.json());
    const sensitivePath =
      data.route.startsWith("/api/admin/exports") ||
      data.route.includes("/documents/") ||
      data.route.includes("/secrets/");
    const category: OperationCategory = data.event !== "client.api_error"
      ? "application"
      : sensitivePath
        ? "data-access"
        : ["POST", "PUT", "PATCH", "DELETE"].includes(data.method ?? "")
          ? "data-integrity"
          : "availability";
    const severity: OperationSeverity = data.event === "client.api_error" &&
      (data.status ?? 0) >= 500 && sensitivePath
      ? "high"
      : "medium";
    await writeOperationsEvent(request, {
      event: data.event,
      source: "client",
      route: data.route,
      method: data.method ?? "CLIENT",
      status: data.status,
      category,
      severity,
      message: data.message,
      errorName: data.errorName,
    });
    return NextResponse.json({ recorded: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.startsWith("CSRF_")) {
      return NextResponse.json({ error: "Security check failed." }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid operations event." }, { status: 400 });
    }
    console.error("Client operations event failed:", error);
    return NextResponse.json({ error: "Unable to record operations event." }, { status: 500 });
  }
}

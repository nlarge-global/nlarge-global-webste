import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/features/admin/auth/session";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
    const limit = 50;
    await connectToDatabase();
    const filter = search ? { $or: [{ action: new RegExp(search.slice(0, 40), "i") }, { resourceType: new RegExp(search.slice(0, 40), "i") }] } : {};
    const [events, total] = await Promise.all([
      AuditEvent.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditEvent.countDocuments(filter),
    ]);
    return NextResponse.json({ events, total, page, pageCount: Math.ceil(total / limit) });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Audit log read failed:", error);
    return NextResponse.json({ error: "Unable to load audit events." }, { status: 500 });
  }
}

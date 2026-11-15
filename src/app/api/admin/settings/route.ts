import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Settings } from "@/features/admin/models/settings";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { connectToDatabase } from "@/lib/mongodb";

const settingsSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  timezone: z.string().trim().min(1).max(100),
  dateFormat: z.string().trim().min(1).max(50),
  emailSignature: z.string().trim().min(1).max(500),
  defaultReplyTemplate: z.string().trim().min(1).max(5000),
});

export async function GET() {
  try {
    await requireAdminSession();
    await connectToDatabase();
    const settings = await Settings.findOne({ key: "dashboard" }).lean();
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Settings read failed:", error);
    return NextResponse.json({ error: "Unable to load settings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = settingsSchema.parse(await request.json());
    await connectToDatabase();
    const settings = await Settings.findOneAndUpdate({ key: "dashboard" }, { ...data, key: "dashboard" }, { upsert: true, new: true, runValidators: true }).lean();
    await writeAuditEvent({ actor: "admin", action: "settings.updated", resourceType: "settings", resourceId: "dashboard", resourceLabel: "Dashboard settings", requestId: getRequestId(request) });
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
    console.error("Settings update failed:", error);
    return NextResponse.json({ error: "Unable to save settings." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const body = z.object({ password: z.string().min(12).max(200) }).parse(await request.json());
    const hash = await bcrypt.hash(body.password, 12);
    await writeAuditEvent({ actor: "admin", action: "settings.password_hash_generated", resourceType: "settings", resourceId: "dashboard", resourceLabel: "Admin password hash", requestId: getRequestId(request) });
    return NextResponse.json({ hash });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
    console.error("Password hash generation failed:", error);
    return NextResponse.json({ error: "Unable to generate password hash." }, { status: 500 });
  }
}

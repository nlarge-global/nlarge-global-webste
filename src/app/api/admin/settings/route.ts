import { getDisplayErrorMessage } from "@/lib/error-message";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateDeploymentSecret } from "@/features/admin/auth/deployment-secret";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { BCRYPT_PASSWORD_TOO_LONG, isWithinBcryptPasswordLimit } from "@/features/admin/auth/bcrypt-password";
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

const generationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("password-hash"),
    password: z.string().min(12).max(200).refine(isWithinBcryptPasswordLimit, BCRYPT_PASSWORD_TOO_LONG),
  }),
  z.object({
    kind: z.literal("secret"),
    secretType: z.enum(["ADMIN_SESSION_SECRET", "UNSUBSCRIBE_TOKEN_SECRET", "MASTER_ENCRYPTION_KEY"]),
  }),
]);

export async function GET() {
  try {
    await requireAdminSession();
    await connectToDatabase();
    const settings = await Settings.findOne({ key: "dashboard" }).lean();
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Settings read failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load settings.") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = settingsSchema.parse(await request.json());
    await connectToDatabase();
    const settings = await Settings.findOneAndUpdate({ key: "dashboard" }, { ...data, key: "dashboard" }, { upsert: true, returnDocument: "after", runValidators: true }).lean();
    await writeAuditEvent({ actor: "admin", action: "settings.updated", resourceType: "settings", resourceId: "dashboard", resourceLabel: "Dashboard settings", requestId: getRequestId(request) });
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
    console.error("Settings update failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to save settings.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const body = generationSchema.parse(await request.json());
    if (body.kind === "password-hash") {
      const hash = await bcrypt.hash(body.password, 12);
      await writeAuditEvent({ actor: "admin", action: "settings.password_hash_generated", resourceType: "settings", resourceId: "dashboard", resourceLabel: "Admin password hash", requestId: getRequestId(request) });
      return NextResponse.json({ hash }, { headers: { "Cache-Control": "no-store" } });
    }

    const secret = generateDeploymentSecret(body.secretType);
    await writeAuditEvent({
      actor: "admin",
      action: "settings.secret_generated",
      resourceType: "settings",
      resourceId: "deployment",
      resourceLabel: "Deployment secret",
      requestId: getRequestId(request),
      metadata: { type: body.secretType },
    });
    return NextResponse.json({ secret }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) {
      const passwordTooLong = error.issues.some((issue) => issue.message === BCRYPT_PASSWORD_TOO_LONG);
      return NextResponse.json({ error: passwordTooLong ? BCRYPT_PASSWORD_TOO_LONG : "Invalid generation request." }, { status: 400 });
    }
    console.error("Settings generation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to generate the requested value.") }, { status: 500 });
  }
}

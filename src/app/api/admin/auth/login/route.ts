import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminCredentials,
  createAdminSession,
} from "@/features/admin/auth/session";
import {
  BCRYPT_PASSWORD_TOO_LONG,
  isWithinBcryptPasswordLimit,
} from "@/features/admin/auth/bcrypt-password";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { RATE_LIMITS } from "@/lib/rate-limit-config";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getOperationsClientIp,
  writeOperationsEvent,
  writeSecurityEvent,
} from "@/features/admin/services/operations";

const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(1)
    .max(200)
    .refine(isWithinBcryptPasswordLimit, BCRYPT_PASSWORD_TOO_LONG),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getOperationsClientIp(request);

  try {
    if (await isRateLimited("adminLogin", ip)) {
      await writeSecurityEvent(request, {
        event: "auth.login_rate_limited",
        severity: "high",
        message: "Admin login attempts exceeded the configured rate limit.",
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(RATE_LIMITS.adminLogin.windowMs / 1000)),
          },
        },
      );
    }

    const data = loginSchema.parse(await request.json());
    const credentials = getAdminCredentials();
    const valid =
      data.email.toLowerCase() === credentials.email.toLowerCase() &&
      (await bcrypt.compare(data.password, credentials.passwordHash));
    if (!valid) {
      await writeSecurityEvent(request, {
        event: "auth.login_failed",
        severity: "medium",
        message: "Admin credentials did not match.",
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const session = await createAdminSession();
    await writeAuditEvent({
      actor: "admin",
      action: "auth.login",
      resourceType: "session",
      resourceLabel: "Admin session",
      requestId,
    });
    await writeSecurityEvent(request, {
      event: "auth.login_success",
      severity: "low",
      status: 200,
      message: "Admin authentication succeeded.",
      ipAddress: ip,
    });
    return NextResponse.json({
      message: "Signed in",
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const passwordTooLong = error.issues.some(
        (issue) => issue.message === BCRYPT_PASSWORD_TOO_LONG,
      );
      return NextResponse.json(
        {
          error: passwordTooLong
            ? BCRYPT_PASSWORD_TOO_LONG
            : "Enter a valid email and password.",
        },
        { status: 400 },
      );
    }
    const referenceId = await writeOperationsEvent(request, {
      category: "application",
      severity: "high",
      event: "auth.login_error",
      status: 503,
      message: error instanceof Error ? error.message : "Admin login failed.",
      errorName: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: `Admin authentication is unavailable. Reference: ${referenceId}`,
        referenceId,
      },
      { status: 503 },
    );
  }
}

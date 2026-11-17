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
  let stage = "request received";
  console.info("[admin-login]", { requestId, stage });
  const ip =
    request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";

  try {
    stage = "checking login rate limit";
    if (await isRateLimited("adminLogin", ip)) {
      console.warn("[admin-login]", { requestId, stage: "IP rate limit exceeded" });
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

    stage = "validating request";
    const data = loginSchema.parse(await request.json());
    stage = "loading admin credentials";
    const credentials = getAdminCredentials();
    stage = "verifying credentials";
    console.info("[admin-login]", {
      requestId,
      stage,
    });
    const valid =
      data.email.toLowerCase() === credentials.email.toLowerCase() &&
      (await bcrypt.compare(data.password, credentials.passwordHash));
    if (!valid) {
      console.warn("[admin-login]", {
        requestId,
        stage: "credentials rejected",
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    stage = "creating session";
    const session = await createAdminSession();
    stage = "writing login audit event";
    await writeAuditEvent({
      actor: "admin",
      action: "auth.login",
      resourceType: "session",
      resourceLabel: "Admin session",
      requestId,
    });
    console.info("[admin-login]", { requestId, stage: "login complete" });
    return NextResponse.json({
      message: "Signed in",
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("[admin-login]", {
        requestId,
        stage: "request validation failed",
      });
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
    console.error("[admin-login] failed", { requestId, stage, error });
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 },
    );
  }
}

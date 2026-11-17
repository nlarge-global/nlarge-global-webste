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
import { isAdminLoginRateLimited } from "@/features/admin/auth/rate-limit";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

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
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isAdminLoginRateLimited(ip)) {
    console.warn("[admin-login]", {
      requestId,
      stage: "IP rate limit exceeded",
    });
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  try {
    stage = "validating request";
    const data = loginSchema.parse(await request.json());
    stage = "loading admin credentials";
    const credentials = getAdminCredentials();
    const accountKey = credentials.email.toLowerCase();
    if (
      data.email.toLowerCase() === accountKey &&
      isAdminLoginRateLimited(`account:${accountKey}`)
    ) {
      console.warn("[admin-login]", {
        requestId,
        stage: "account rate limit exceeded",
      });
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 },
      );
    }
    stage = "verifying credentials";
    console.info("[admin-login]", {
      requestId,
      stage: "verifying credentials",
      email: data.email,
      ip,
      accountKey,
      credentialsEmail: credentials.email,
      credentialsPasswordHash: credentials.passwordHash,
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

import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminCredentials, createAdminSession } from "@/features/admin/auth/session";
import { isAdminLoginRateLimited } from "@/features/admin/auth/rate-limit";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isAdminLoginRateLimited(ip)) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  try {
    const data = loginSchema.parse(await request.json());
    const credentials = getAdminCredentials();
    const valid = data.email.toLowerCase() === credentials.email.toLowerCase()
      && await bcrypt.compare(data.password, credentials.passwordHash);
    if (!valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const session = await createAdminSession();
    await writeAuditEvent({ actor: "admin", action: "auth.login", resourceType: "session", requestId: getRequestId(request) });
    return NextResponse.json({ message: "Signed in", expiresAt: session.expiresAt.toISOString() });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Admin authentication is not configured." }, { status: 503 });
  }
}

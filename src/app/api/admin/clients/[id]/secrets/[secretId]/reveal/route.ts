import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminCredentials, requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { decryptSecretValue } from "@/features/admin/auth/encryption";
import { Secret } from "@/features/admin/models/secret";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { BCRYPT_PASSWORD_TOO_LONG, isWithinBcryptPasswordLimit } from "@/features/admin/auth/bcrypt-password";

const revealSchema = z.object({
  password: z.string().min(1).max(200).refine(isWithinBcryptPasswordLimit, BCRYPT_PASSWORD_TOO_LONG),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; secretId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { password, } = revealSchema.parse(await request.json());
    const credentials = getAdminCredentials();
    if (!await bcrypt.compare(password, credentials.passwordHash)) return NextResponse.json({ error: "Re-authentication failed." }, { status: 403 });
    const { id, secretId } = await params;
    await connectToDatabase();
    const result = await getClientWithKey(id);
    const secret = await Secret.findOne({ _id: secretId, clientId: id }).select("+encryptedValue +iv +authTag +keyVersion ciphertext");
    if (!result || !secret) return NextResponse.json({ error: "Secret not found." }, { status: 404 });
    const ciphertext = secret.encryptedValue ?? (secret as typeof secret & { ciphertext?: string }).ciphertext;
    if (!ciphertext || !secret.iv || !secret.authTag || !secret.keyVersion) {
      return NextResponse.json({ error: "This secret has incomplete encrypted data and cannot be revealed." }, { status: 422 });
    }
    const value = decryptSecretValue({
      ciphertext,
      iv: secret.iv,
      authTag: secret.authTag,
      keyVersion: secret.keyVersion,
    }, result.key);
    await writeAuditEvent({ actor: "admin", action: "secret.revealed", resourceType: "secret", resourceId: secretId, resourceLabel: secret.label, requestId: getRequestId(request), metadata: { clientId: id, type: secret.type } });
    return NextResponse.json({ value });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) {
      const passwordTooLong = error.issues.some((issue) => issue.message === BCRYPT_PASSWORD_TOO_LONG);
      return NextResponse.json({ error: passwordTooLong ? BCRYPT_PASSWORD_TOO_LONG : "Password is required." }, { status: 400 });
    }
    console.error("Secret reveal failed:", error);
    return NextResponse.json({ error: "Unable to reveal secret." }, { status: 500 });
  }
}

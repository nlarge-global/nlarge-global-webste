import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { encryptSecretValue } from "@/features/admin/auth/encryption";
import { Client } from "@/features/admin/models/client";
import { Secret } from "@/features/admin/models/secret";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const secretSchema = z.object({
  label: z.string().trim().min(1).max(150),
  type: z.enum(["username-password", "api-key", "token", "connection-string", "environment-file", "certificate", "recovery-codes", "other"]),
  value: z.string().min(1).max(100_000),
  expiresAt: z.coerce.date().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    if (!await Client.exists({ _id: id })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const secrets = await Secret.find({ clientId: id }).select("label type expiresAt createdAt").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ secrets });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Secret list failed:", error);
    return NextResponse.json({ error: "Unable to load secrets." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = secretSchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    const result = await getClientWithKey(id);
    if (!result) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const encrypted = encryptSecretValue(data.value, result.key, result.client.dataKeyVersion ?? "v1");
    const secret = await Secret.create({
      clientId: result.client._id,
      label: data.label,
      type: data.type,
      encryptedValue: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyVersion: encrypted.keyVersion,
      expiresAt: data.expiresAt,
    });
    await writeAuditEvent({ actor: "admin", action: "secret.created", resourceType: "secret", resourceId: String(secret._id), requestId: getRequestId(request), metadata: { clientId: id, type: data.type } });
    return NextResponse.json({ secret: { _id: secret._id, label: secret.label, type: secret.type, expiresAt: secret.expiresAt } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid secret details." }, { status: 400 });
    console.error("Secret creation failed:", error);
    return NextResponse.json({ error: "Unable to save secret." }, { status: 500 });
  }
}

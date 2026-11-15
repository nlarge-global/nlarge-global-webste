import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { encryptSecretValue } from "@/features/admin/auth/encryption";
import { Secret } from "@/features/admin/models/secret";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const updateSchema = z.object({
  label: z.string().trim().min(1).max(150),
  type: z.enum(["username-password", "api-key", "token", "connection-string", "environment-file", "certificate", "recovery-codes", "other"]),
  value: z.string().min(1).max(100_000).optional(),
  expiresAt: z.coerce.date().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; secretId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, secretId } = await params;
    const data = updateSchema.parse(await request.json());
    await connectToDatabase();
    const secret = await Secret.findOne({ _id: secretId, clientId: id }).select("+encryptedValue +iv +authTag +keyVersion");
    if (!secret) return NextResponse.json({ error: "Secret not found." }, { status: 404 });
    const update: Record<string, unknown> = { label: data.label, type: data.type, expiresAt: data.expiresAt };
    if (data.value) {
      const result = await getClientWithKey(id);
      if (!result) return NextResponse.json({ error: "Client not found." }, { status: 404 });
      const encrypted = encryptSecretValue(data.value, result.key, result.client.dataKeyVersion ?? "v1");
      Object.assign(update, { encryptedValue: encrypted.ciphertext, iv: encrypted.iv, authTag: encrypted.authTag, keyVersion: encrypted.keyVersion });
    }
    const saved = await Secret.findByIdAndUpdate(secretId, update, { new: true }).select("label type expiresAt").lean();
    await writeAuditEvent({ actor: "admin", action: "secret.updated", resourceType: "secret", resourceId: secretId, resourceLabel: saved?.label, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ secret: saved });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid secret details." }, { status: 400 });
    console.error("Secret update failed:", error);
    return NextResponse.json({ error: "Unable to update secret." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; secretId: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id, secretId } = await params;
    if (request.headers.get("x-confirm-delete") !== secretId) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
    await connectToDatabase();
    const secret = await Secret.findOneAndUpdate({ _id: secretId, clientId: id }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!secret) return NextResponse.json({ error: "Secret not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "secret.deleted", resourceType: "secret", resourceId: secretId, resourceLabel: secret.label, requestId: getRequestId(request), metadata: { clientId: id } });
    return NextResponse.json({ message: "Secret deleted." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    console.error("Secret deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete secret." }, { status: 500 });
  }
}

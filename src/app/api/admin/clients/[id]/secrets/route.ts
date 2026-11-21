import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { encryptSecretValue } from "@/features/admin/auth/encryption";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Secret } from "@/features/admin/models/secret";
import { connectToDatabase } from "@/lib/mongodb";
import { getClientWithKey } from "@/features/admin/auth/secret-keys";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const secretSchema = z.object({
  label: z.string().trim().min(1).max(150),
  type: z.enum(["username-password", "api-key", "token", "connection-string", "environment-file", "certificate", "recovery-codes", "other"]),
  value: z.string().min(1).max(100_000),
  expiresAt: z.coerce.date().nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    if (!await Client.exists({ _id: id })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const searchParams = new URL(_request.url).searchParams;
    const projectId = searchParams.get("projectId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));
    const archive = searchParams.get("archive");
    const type = searchParams.get("type");
    const includeDeleted = archive === "archived" || archive === "all";
    if (projectId && !await Project.exists({ _id: projectId, clientId: id }).setOptions({ includeDeleted })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const filter: Record<string, unknown> = {
      clientId: id,
      ...(projectId ? { projectId } : {}),
      ...(type ? { type } : {}),
      ...(archive === "active" || !archive ? { deletedAt: { $exists: false } } : {}),
      ...(archive === "archived" ? { deletedAt: { $exists: true } } : {}),
    };
    const [secrets, total] = await Promise.all([
      Secret.find(filter).setOptions({ includeDeleted }).select("label type expiresAt deletedAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Secret.countDocuments(filter).setOptions({ includeDeleted }),
    ]);
    return NextResponse.json({ secrets, pagination: { page, limit, total, hasNext: page * limit < total } });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Secret list failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load secrets.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const body = await request.json() as { projectId?: string; label?: string; type?: string; value?: string; expiresAt?: string | null };
    const data = secretSchema.parse(body);
    const { id } = await params;
    await connectToDatabase();
    const result = await getClientWithKey(id);
    if (!result) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    if (body.projectId && !await Project.exists({ _id: body.projectId, clientId: id })) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const encrypted = encryptSecretValue(data.value, result.key, result.client.dataKeyVersion ?? "v1");
    const secret = await Secret.create({
      clientId: result.client._id,
      projectId: body.projectId,
      label: data.label,
      type: data.type,
      encryptedValue: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyVersion: encrypted.keyVersion,
      expiresAt: data.expiresAt ?? null,
    });
    await writeAuditEvent({ actor: "admin", action: "secret.created", resourceType: "secret", resourceId: String(secret._id), resourceLabel: secret.label, requestId: getRequestId(request), metadata: { clientId: id, type: data.type } });
    return NextResponse.json({ secret: { _id: secret._id, label: secret.label, type: secret.type, expiresAt: secret.expiresAt } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid secret details." }, { status: 400 });
    console.error("Secret creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to save secret.") }, { status: 500 });
  }
}

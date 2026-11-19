import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireAdminSession,
  validateCsrfToken,
} from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Inquiry } from "@/features/admin/models/inquiry";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { Secret } from "@/features/admin/models/secret";
import { ClientDocument } from "@/features/admin/models/document";
import { PaymentRecord } from "@/features/admin/models/payment";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { deletePrivateObject } from "@/lib/r2";
import { getDeleteMode } from "@/features/admin/services/delete-mode";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const clientUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional().or(z.literal("")),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const client = await Client.findById(id).lean();
    if (!client)
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const inquiries = await Inquiry.find({ clientId: client._id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ client, inquiries });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Client read failed:", error);
    return NextResponse.json(
      { error: getDisplayErrorMessage(error, "Unable to load client.") },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = clientUpdateSchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    const client = await Client.findByIdAndUpdate(
      id,
      { ...data, email: data.email || undefined },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!client)
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    await writeAuditEvent({
      actor: "admin",
      action: "client.updated",
      resourceType: "client",
      resourceId: id,
      resourceLabel: client.name,
      requestId: getRequestId(request),
    });
    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_"))
      return NextResponse.json(
        { error: "Security check failed. Refresh and try again." },
        { status: 403 },
      );
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid client details." },
        { status: 400 },
      );
    console.error("Client update failed:", error);
    return NextResponse.json(
      { error: getDisplayErrorMessage(error, "Unable to update client.") },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const { id } = await params;
    if (request.headers.get("x-confirm-delete") !== id)
      return NextResponse.json(
        { error: "Explicit delete confirmation is required." },
        { status: 400 },
      );
    const mode = getDeleteMode(request);
    if (!mode)
      return NextResponse.json(
        { error: "Choose archive or permanent deletion." },
        { status: 400 },
      );
    await connectToDatabase();
    const client = await Client.findById(id);
    if (!client)
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    if (mode === "permanent") {
      const [projects, inquiries, documents] = await Promise.all([
        Project.find({ clientId: id })
          .select("_id")
          .setOptions({ includeDeleted: true })
          .lean(),
        Inquiry.find({ clientId: id })
          .select("_id")
          .setOptions({ includeDeleted: true })
          .lean(),
        ClientDocument.find({ clientId: id })
          .select("objectKey")
          .setOptions({ includeDeleted: true })
          .lean(),
      ]);
      const projectIds = projects.map((project) => project._id);
      const inquiryIds = inquiries.map((inquiry) => inquiry._id);
      await Promise.all(
        documents.map(({ objectKey }) => deletePrivateObject(objectKey)),
      );
      await Promise.all([
        Project.deleteMany({ clientId: id }),
        Task.deleteMany({
          $or: [
            { clientId: id },
            { projectId: { $in: projectIds } },
            { inquiryId: { $in: inquiryIds } },
          ],
        }),
        Secret.deleteMany({ clientId: id }),
        ClientDocument.deleteMany({ clientId: id }),
        PaymentRecord.deleteMany({ clientId: id }),
        ConversationEntry.deleteMany({ inquiryId: { $in: inquiryIds } }),
        Inquiry.deleteMany({ clientId: id }),
      ]);
      await Client.deleteOne({ _id: id });
      await writeAuditEvent({
        actor: "admin",
        action: "client.deleted",
        resourceType: "client",
        resourceId: id,
        resourceLabel: client.name,
        requestId: getRequestId(request),
        metadata: { cascade: true, permanentDelete: true },
      });
      return NextResponse.json({
        message: "Client and linked records permanently deleted.",
      });
    }
    const deletedAt = new Date();
    const projects = await Project.find({ clientId: id }).select("_id").lean();
    const projectIds = projects.map((project) => project._id);
    await Promise.all([
      Project.updateMany({ clientId: id }, { $set: { deletedAt } }),
      Task.updateMany(
        { $or: [{ clientId: id }, { projectId: { $in: projectIds } }] },
        { $set: { deletedAt } },
      ),
      Secret.updateMany({ clientId: id }, { $set: { deletedAt } }),
      ClientDocument.updateMany({ clientId: id }, { $set: { deletedAt } }),
      PaymentRecord.updateMany({ clientId: id }, { $set: { deletedAt } }),
      Inquiry.updateMany({ clientId: id }, { $set: { deletedAt } }),
      Client.updateOne({ _id: id }, { $set: { deletedAt } }),
    ]);
    await writeAuditEvent({
      actor: "admin",
      action: "client.deleted",
      resourceType: "client",
      resourceId: id,
      resourceLabel: client.name,
      requestId: getRequestId(request),
      metadata: { cascade: true, softDelete: true },
    });
    return NextResponse.json({ message: "Client archived." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_"))
      return NextResponse.json(
        { error: "Security check failed. Refresh and try again." },
        { status: 403 },
      );
    console.error("Client deletion failed:", error);
    return NextResponse.json(
      { error: getDisplayErrorMessage(error, "Unable to delete client.") },
      { status: 500 },
    );
  }
}

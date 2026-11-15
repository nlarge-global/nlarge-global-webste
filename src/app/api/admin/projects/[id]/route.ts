import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { Secret } from "@/features/admin/models/secret";
import { ClientDocument } from "@/features/admin/models/document";
import { PaymentRecord } from "@/features/admin/models/payment";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const projectUpdateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  technicalDetails: z.string().trim().max(5000).optional(),
  deliveryDetails: z.string().trim().max(5000).optional(),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  environment: z.string().trim().max(100).optional(),
  productionUrl: z.string().url().optional().or(z.literal("")),
  stagingUrl: z.string().url().optional().or(z.literal("")),
  deadline: z.coerce.date().optional(),
  notes: z.string().trim().max(5000).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await connectToDatabase();
    const project = await Project.findById(id).lean();
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const tasks = await Task.find({ projectId: project._id }).sort({ status: 1, dueDate: 1 }).lean();
    return NextResponse.json({ project, tasks });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Project read failed:", error);
    return NextResponse.json({ error: "Unable to load project." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = projectUpdateSchema.parse(await request.json());
    const { id } = await params;
    await connectToDatabase();
    const project = await Project.findByIdAndUpdate(id, { ...data, repositoryUrl: data.repositoryUrl || undefined, productionUrl: data.productionUrl || undefined, stagingUrl: data.stagingUrl || undefined }, { new: true, runValidators: true }).lean();
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    await writeAuditEvent({ actor: "admin", action: "project.updated", resourceType: "project", resourceId: id, requestId: getRequestId(request) });
    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid project details." }, { status: 400 });
    console.error("Project update failed:", error);
    return NextResponse.json({ error: "Unable to update project." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await requireAdminSession();
      await validateCsrfToken(request, session);
      const { id } = await params;
      if (request.headers.get("x-confirm-delete") !== id) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
      await connectToDatabase();
      const project = await Project.findById(id);
      if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
      const deletedAt = new Date();
      await Promise.all([
        Task.updateMany({ projectId: id }, { $set: { deletedAt } }),
        Secret.updateMany({ projectId: id }, { $set: { deletedAt } }),
        ClientDocument.updateMany({ projectId: id }, { $set: { deletedAt } }),
        PaymentRecord.updateMany({ projectId: id }, { $set: { deletedAt } }),
        Project.updateOne({ _id: id }, { $set: { deletedAt } }),
      ]);
      await writeAuditEvent({ actor: "admin", action: "project.deleted", resourceType: "project", resourceId: id, requestId: getRequestId(request), metadata: { cascade: true, softDelete: true } });
      return NextResponse.json({ message: "Project archived." });
    } catch (error) {
      if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
      console.error("Project deletion failed:", error);
      return NextResponse.json({ error: "Unable to archive project." }, { status: 500 });
  }
}

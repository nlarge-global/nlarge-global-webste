import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const taskSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  title: z.string().trim().min(1).max(200),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  notes: z.string().trim().max(3000).optional(),
});

const taskUpdateSchema = z.object({
  status: z.enum(["todo", "in-progress", "done"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = taskSchema.parse(await request.json());
    await connectToDatabase();
    const project = await Project.findById(data.projectId).select("clientId");
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (!await Client.exists({ _id: project.clientId })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const task = await Task.create({ ...data, clientId: project.clientId, completedAt: data.status === "done" ? new Date() : undefined });
    await writeAuditEvent({ actor: "admin", action: "task.created", resourceType: "task", resourceId: String(task._id), requestId: getRequestId(request), metadata: { projectId: data.projectId, status: data.status } });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task details." }, { status: 400 });
    console.error("Task creation failed:", error);
    return NextResponse.json({ error: "Unable to create task." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
      const session = await requireAdminSession();
      await validateCsrfToken(request, session);
      const body = await request.json() as { taskId?: string; status?: string };
      const taskId = z.string().regex(/^[a-f\d]{24}$/i).parse(body.taskId);
      const { status } = taskUpdateSchema.parse(body);
      await connectToDatabase();
      const task = await Task.findByIdAndUpdate(
        taskId,
        { status, completedAt: status === "done" ? new Date() : undefined },
        { new: true, runValidators: true },
      ).lean();
      if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
      await writeAuditEvent({
        actor: "admin",
        action: "task.status_changed",
        resourceType: "task",
        resourceId: taskId,
        requestId: getRequestId(request),
        metadata: { status },
      });
      return NextResponse.json({ task });
    } catch (error) {
      if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
      if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task details." }, { status: 400 });
      console.error("Task update failed:", error);
      return NextResponse.json({ error: "Unable to update task." }, { status: 500 });
  }
}

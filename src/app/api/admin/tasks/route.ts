import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { getRecordActionMode } from "@/features/admin/services/delete-mode";

const taskSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  title: z.string().trim().min(1).max(200),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  notes: z.string().trim().max(3000).optional(),
});

const taskUpdateSchema = z.object({
  status: z.enum(["todo", "in-progress", "done"]).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  notes: z.string().trim().max(3000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = taskSchema.parse(await request.json());
    await connectToDatabase();
    const project = await Project.findById(data.projectId).select("clientId name");
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (!await Client.exists({ _id: project.clientId })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const task = await Task.create({ ...data, clientId: project.clientId, completedAt: data.status === "done" ? new Date() : undefined });
    await writeAuditEvent({ actor: "admin", action: "task.created", resourceType: "task", resourceId: String(task._id), resourceLabel: task.title, requestId: getRequestId(request), metadata: { projectId: data.projectId, status: data.status } });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task details." }, { status: 400 });
    console.error("Task creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to create task.") }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const taskId = z.string().regex(/^[a-f\d]{24}$/i).parse(
      new URL(request.url).searchParams.get("taskId"),
    );
    await connectToDatabase();
    const task = await Task.findById(taskId)
      .select("title status priority dueDate notes createdAt updatedAt completedAt")
      .lean();
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ task }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
    console.error("Task details failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load task details.") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
      const session = await requireAdminSession();
      await validateCsrfToken(request, session);
      const body = await request.json() as { taskId?: string; status?: string };
      const taskId = z.string().regex(/^[a-f\d]{24}$/i).parse(body.taskId);
      const data = taskUpdateSchema.parse(body);
      await connectToDatabase();
      const currentTask = await Task.findById(taskId).select("status completedAt");
      if (!currentTask) return NextResponse.json({ error: "Task not found." }, { status: 404 });
      const update = {
        $set: {
          ...data,
          ...(data.status === "done" &&
          (currentTask.status !== "done" || !currentTask.completedAt)
            ? { completedAt: new Date() }
            : {}),
        },
        ...(data.status && data.status !== "done"
          ? { $unset: { completedAt: 1 } }
          : {}),
      };
      const task = await Task.findByIdAndUpdate(
        taskId,
        update,
        { returnDocument: "after", runValidators: true },
      ).lean();
      if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
      await writeAuditEvent({
        actor: "admin",
        action: "task.status_changed",
        resourceType: "task",
        resourceId: taskId,
        resourceLabel: task.title,
        requestId: getRequestId(request),
        metadata: { status: task.status, priority: task.priority, updated: Boolean(data.title) },
      });
      return NextResponse.json({ task });
    } catch (error) {
      if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
      if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task details." }, { status: 400 });
      console.error("Task update failed:", error);
      return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to update task.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
      const session = await requireAdminSession();
      await validateCsrfToken(request, session);
      const taskId = z.string().regex(/^[a-f\d]{24}$/i).parse(new URL(request.url).searchParams.get("taskId"));
      if (request.headers.get("x-confirm-delete") !== taskId) return NextResponse.json({ error: "Explicit delete confirmation is required." }, { status: 400 });
      const mode = getRecordActionMode(request);
      if (!mode) return NextResponse.json({ error: "Choose archive or permanent deletion." }, { status: 400 });
      await connectToDatabase();
      const task = mode === "restore"
        ? await Task.findOneAndUpdate(
            { _id: taskId, deletedAt: { $exists: true } },
            { $unset: { deletedAt: 1 } },
            { returnDocument: "after" },
          ).lean()
        : mode === "permanent"
          ? await Task.findOneAndDelete({ _id: taskId }).lean()
          : await Task.findOneAndUpdate({ _id: taskId, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } }, { returnDocument: "after" }).lean();
      if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
      await writeAuditEvent({ actor: "admin", action: mode === "restore" ? "task.restored" : "task.deleted", resourceType: "task", resourceId: taskId, resourceLabel: task.title, requestId: getRequestId(request), metadata: { [mode === "permanent" ? "permanentDelete" : mode === "restore" ? "restored" : "softDelete"]: true, status: task.status } });
      return NextResponse.json({ message: mode === "permanent" ? "Task permanently deleted." : mode === "restore" ? "Task restored." : "Task archived." });
    } catch (error) {
      if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
      if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
      console.error("Task deletion failed:", error);
      return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to delete task.") }, { status: 500 });
  }
}

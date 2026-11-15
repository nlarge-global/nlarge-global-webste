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

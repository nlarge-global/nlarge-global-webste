import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, validateCsrfToken } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

const projectSchema = z.object({
  clientId: z.string().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(1).max(150),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
  technicalDetails: z.string().trim().max(5000).optional(),
  deliveryDetails: z.string().trim().max(5000).optional(),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
  environment: z.string().trim().max(100).optional(),
  productionUrl: z.string().url().optional().or(z.literal("")),
  stagingUrl: z.string().url().optional().or(z.literal("")),
  deadline: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.date().optional(),
  ),
  deliveredAt: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.date().optional(),
  ),
  notes: z.string().trim().max(5000).optional(),
});

export async function GET() {
  try {
    await requireAdminSession();
    await connectToDatabase();
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Project list failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to load projects.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await validateCsrfToken(request, session);
    const data = projectSchema.parse(await request.json());
    await connectToDatabase();
    if (!await Client.exists({ _id: data.clientId })) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    const project = await Project.create({
      ...data,
      repositoryUrl: data.repositoryUrl || undefined,
      productionUrl: data.productionUrl || undefined,
      stagingUrl: data.stagingUrl || undefined,
    });
    await writeAuditEvent({ actor: "admin", action: "project.created", resourceType: "project", resourceId: String(project._id), resourceLabel: project.name, requestId: getRequestId(request), metadata: { clientId: data.clientId } });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.startsWith("CSRF_")) return NextResponse.json({ error: "Security check failed. Refresh and try again." }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid project details." }, { status: 400 });
    console.error("Project creation failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to create project.") }, { status: 500 });
  }
}

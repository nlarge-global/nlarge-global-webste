import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiBriefcase } from "react-icons/fi";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ClientDialog from "@/features/admin/components/ClientDialog";
import { Client } from "@/features/admin/models/client";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import ProjectDialog from "@/features/admin/components/ProjectDialog";
import Pagination from "@/features/admin/components/Pagination";

const TASK_PAGE_SIZE = 10;

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ taskPage?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { clientId: id } = await params;
  const taskPage = Math.max(1, Number((await searchParams).taskPage || 1));
  await connectToDatabase();
  const client = await Client.findById(id).lean();
  if (!client) notFound();
  const [inquiries, projects, tasks] = await Promise.all([
    Inquiry.find({ clientId: client._id }).sort({ createdAt: -1 }).lean(),
    Project.find({ clientId: client._id }).sort({ createdAt: -1 }).lean(),
    Promise.all([
      Task.find({ clientId: client._id }).sort({ dueDate: 1, createdAt: -1 }).skip((taskPage - 1) * TASK_PAGE_SIZE).limit(TASK_PAGE_SIZE).lean(),
      Task.countDocuments({ clientId: client._id }),
    ]),
  ]);
  const [clientTasks, taskTotal] = tasks;
  const projectMap = new Map(
    projects.map((project) => [String(project._id), project.name]),
  );
  return (
    <div>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
        {client.name}
      </h1>
      <p className="mt-2 text-sm text-black/55">
        Manage this client’s projects and related operational records.
      </p>
      <div className="mt-4">
        <ClientDialog
          client={{
            ...client,
            _id: String(client._id),
            email: client.email ?? undefined,
            company: client.company ?? undefined,
            phone: client.phone ?? undefined,
            notes: client.notes ?? undefined,
          }}
          redirectTo="/admin/clients"
        />
      </div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Projects</h2>
          <ProjectDialog
            clients={[{ _id: String(client._id), name: client.name }]}
          />
        </div>
        <div className="mt-4 divide-y divide-black/10">
          {projects.length === 0 && (
            <p className="py-5 text-sm text-black/50">No projects yet.</p>
          )}
          {projects.map((project) => (
            <Link
              key={String(project._id)}
              href={`/admin/clients/${client._id}/projects/${project._id}`}
              className="flex items-center justify-between gap-3 py-4 hover:text-[#602329]"
            >
              <span>
                <span className="block font-medium">{project.name}</span>
                <span className="mt-1 block text-sm text-black/50">
                  {project.environment || "No environment"}
                  {project.deadline
                    ? ` · due ${project.deadline.toLocaleDateString()}`
                    : ""}
                </span>
              </span>
              <FiBriefcase aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Linked inquiries</h2>
        <div className="mt-4 divide-y divide-black/10">
          {inquiries.length === 0 && (
            <p className="py-5 text-sm text-black/50">No inquiries linked.</p>
          )}
          {inquiries.map((inquiry) => (
            <Link
              key={String(inquiry._id)}
              href={`/admin/inquiries/${inquiry._id}`}
              className="block py-4 hover:text-[#602329]"
            >
              <p className="font-medium">{inquiry.subject}</p>
              <p className="mt-1 text-sm text-black/50">
                {inquiry.status} · {inquiry.email}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Client tasks</h2>
          <Link
            href="/admin/overview/tasks"
            className="text-sm font-semibold text-[#602329]"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-black/10">
          {clientTasks.length === 0 && (
            <p className="py-5 text-sm text-black/50">No tasks yet.</p>
          )}
          {clientTasks.map((task) => (
            <Link
              key={String(task._id)}
              href={`/admin/clients/${client._id}/projects/${task.projectId}`}
              className="block py-4 hover:text-[#602329]"
            >
              <p className="font-medium">{task.title}</p>
              <p className="mt-1 text-sm capitalize text-black/50">
                {projectMap.get(String(task.projectId)) ?? "Unassigned project"}{" "}
                · {task.status}
              </p>
            </Link>
          ))}
        </div>
        <Pagination page={taskPage} hasNext={taskPage * TASK_PAGE_SIZE < taskTotal} basePath={`/admin/clients/${client._id}`} param="taskPage" />
      </section>
      <p className="mt-6 text-sm text-black/50">
        Secrets, documents, and payments are managed from each project
        dashboard.
      </p>
    </div>
  );
}

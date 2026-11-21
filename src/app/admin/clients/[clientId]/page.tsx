import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowUpRight, FiBriefcase, FiMail } from "react-icons/fi";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ClientDialog from "@/features/admin/components/ClientDialog";
import { Client } from "@/features/admin/models/client";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import ProjectDialog from "@/features/admin/components/ProjectDialog";
import Pagination from "@/features/admin/components/Pagination";
import { formatDateTime } from "@/features/admin/services/date-time";
import { getDueDateState } from "@/features/admin/services/due-date-state";
import RecordBadge from "@/features/admin/components/RecordBadge";
import AdminListFilters from "@/features/admin/components/AdminListFilters";
import {
  getArchiveQuery,
  includesArchived,
  parseArchiveFilter,
} from "@/features/admin/services/archive-filter";

const TASK_PAGE_SIZE = 10;

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ taskPage?: string; archive?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { clientId: id } = await params;
  const query = await searchParams;
  const taskPage = Math.max(1, Number(query.taskPage || 1));
  const archive = parseArchiveFilter(query.archive);
  const archiveQuery = getArchiveQuery(archive);
  const archiveOptions = { includeDeleted: includesArchived(archive) };
  await connectToDatabase();
  const client = await Client.findById(id).lean();
  if (!client) notFound();
  const [inquiries, projects, tasks] = await Promise.all([
    Inquiry.find({ clientId: client._id, ...archiveQuery })
      .setOptions(archiveOptions)
      .sort({ createdAt: -1 })
      .lean(),
    Project.find({ clientId: client._id, ...archiveQuery })
      .setOptions(archiveOptions)
      .sort({ createdAt: -1 })
      .lean(),
    Promise.all([
      Task.find({ clientId: client._id, ...archiveQuery })
        .setOptions(archiveOptions)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((taskPage - 1) * TASK_PAGE_SIZE)
        .limit(TASK_PAGE_SIZE)
        .lean(),
      Task.countDocuments({ clientId: client._id, ...archiveQuery }).setOptions(
        archiveOptions,
      ),
    ]),
  ]);
  const [clientTasks, taskTotal] = tasks;
  const projectMap = new Map(
    projects.map((project) => [String(project._id), project.name]),
  );
  return (
    <div>
      <header className="flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="max-w-4xl break-words text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
            {client.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Manage this client’s projects and related operational records.
          </p>
          {(client.company || client.email) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-black/65">
              {client.company && (
                <span className="inline-flex items-center gap-2">
                  <FiBriefcase
                    aria-hidden="true"
                    className="size-4 text-[#602329]"
                  />
                  {client.company}
                </span>
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-2 underline-offset-4 hover:text-[#602329] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]"
                >
                  <FiMail
                    aria-hidden="true"
                    className="size-4 text-[#602329]"
                  />
                  {client.email}
                  <FiArrowUpRight aria-hidden="true" className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <AdminListFilters
            fields={[
              {
                name: "archive",
                label: "Records",
                value: archive,
                options: [
                  { value: "active", label: "Active" },
                  { value: "archived", label: "Archived" },
                  { value: "all", label: "All records" },
                ],
              },
            ]}
          />
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
      </header>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white sm:p-5 p-2">
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
          {projects.map((project) => {
            const projectStatus = project.status ?? "todo";
            const dueState = getDueDateState(project.deadline);
            return (
              <Link
                key={String(project._id)}
                href={`/admin/clients/${client._id}/projects/${project._id}?archive=${archive}`}
                className="flex items-center justify-between gap-3 py-4 hover:text-[#602329]"
              >
                <span>
                  <span className="block font-medium">{project.name}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <RecordBadge status={projectStatus} />
                    <span className="text-sm text-black/50">
                      {project.environment || "No environment"}
                    </span>
                    {projectStatus === "done" && project.deliveredAt && (
                      <RecordBadge
                        status="due-done"
                        label={`Delivered ${formatDateTime(project.deliveredAt)}`}
                      />
                    )}
                    {projectStatus !== "done" && project.deadline && (
                      <RecordBadge
                        status={
                          dueState === "overdue"
                            ? "due-overdue"
                            : dueState === "today" || dueState === "soon"
                              ? "due-soon"
                              : "due-later"
                        }
                        label={`Due ${formatDateTime(project.deadline)}`}
                      />
                    )}
                  </span>
                </span>
                <FiBriefcase aria-hidden="true" />
              </Link>
            );
          })}
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
                <RecordBadge status={inquiry.status} />{" "}
                <span>{inquiry.email}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Client tasks</h2>
        </div>
        <div className="mt-4 divide-y divide-black/10">
          {clientTasks.length === 0 && (
            <p className="py-5 text-sm text-black/50">No tasks yet.</p>
          )}
          {clientTasks.map((task) => (
            <Link
              key={String(task._id)}
              href={`/admin/clients/${client._id}/projects/${task.projectId}?archive=${archive}`}
              className="block py-4 hover:text-[#602329]"
            >
              <p className="font-medium">{task.title}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm capitalize text-black/50">
                <span>
                  {projectMap.get(String(task.projectId)) ??
                    "Unassigned project"}
                </span>
                <RecordBadge status={task.status} />
              </p>
            </Link>
          ))}
        </div>
        <Pagination
          page={taskPage}
          total={taskTotal}
          pageSize={TASK_PAGE_SIZE}
          basePath={`/admin/clients/${client._id}`}
          param="taskPage"
          queryParams={{ archive }}
        />
      </section>
      <p className="mt-6 text-sm text-black/50">
        Secrets, documents, and payments are managed from each project
        dashboard.
      </p>
    </div>
  );
}

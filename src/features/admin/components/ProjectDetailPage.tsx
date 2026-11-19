import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowUpRight,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiKey,
} from "react-icons/fi";
import TaskList from "@/features/admin/components/TaskList";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { Secret } from "@/features/admin/models/secret";
import { ClientDocument } from "@/features/admin/models/document";
import { PaymentRecord } from "@/features/admin/models/payment";
import { connectToDatabase } from "@/lib/mongodb";
import ProjectActions from "./ProjectActions";
import { getDueDateState } from "@/features/admin/services/due-date-state";
import { formatDateTime } from "@/features/admin/services/date-time";
import RecordBadge from "./RecordBadge";
import AdminListFilters from "./AdminListFilters";
import {
  getArchiveQuery,
  includesArchived,
  parseArchiveFilter,
} from "@/features/admin/services/archive-filter";

function safeExternalUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function ProjectDetail({
  label,
  value,
  href,
  dateTime,
  valueClassName,
}: {
  label: string;
  value?: string;
  href?: string;
  dateTime?: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-black/50">
        {label}
      </dt>
      <dd
        className={`mt-1 whitespace-pre-wrap break-words text-sm leading-6 ${valueClassName ?? "text-black/80"}`}
      >
        {value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[#602329] underline decoration-[#602329]/30 underline-offset-2 hover:decoration-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
            >
              {value}
            </a>
          ) : dateTime ? (
            <time dateTime={dateTime}>{value}</time>
          ) : (
            value
          )
        ) : (
          <span className="text-black/40">Not provided</span>
        )}
      </dd>
    </div>
  );
}

export default async function ProjectDetailPage({
  projectId,
  archive: archiveParam,
}: {
  projectId: string;
  archive?: string;
}) {
  await connectToDatabase();
  const project = await Project.findById(projectId).lean();
  if (!project) notFound();
  const archive = parseArchiveFilter(archiveParam);
  const archiveQuery = getArchiveQuery(archive);
  const archiveOptions = { includeDeleted: includesArchived(archive) };
  const [client, tasks, secretCount, documentCount, paymentCount] =
    await Promise.all([
      Client.findById(project.clientId).select("_id name"),
      Task.find({ projectId: project._id, ...archiveQuery })
        .setOptions(archiveOptions)
        .select("title status priority dueDate completedAt notes")
        .sort({ status: 1, dueDate: 1 })
        .lean(),
      Secret.countDocuments({
        clientId: project.clientId,
        ...archiveQuery,
        projectId: project._id,
      }).setOptions(archiveOptions),
      ClientDocument.countDocuments({
        clientId: project.clientId,
        ...archiveQuery,
        projectId: project._id,
      }).setOptions(archiveOptions),
      PaymentRecord.countDocuments({
        clientId: project.clientId,
        ...archiveQuery,
        projectId: project._id,
      }).setOptions(archiveOptions),
    ]);
  if (!client) notFound();
  const clientId = String(client._id);
  const projectStatus = project.status ?? "todo";
  const projectDueState =
    projectStatus === "done" ? null : getDueDateState(project.deadline);
  const canonicalPath = `/admin/clients/${clientId}/projects/${project._id}`;
  return (
    <div>
      <header className="flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/admin/clients/${clientId}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium text-[#602329] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]"
          >
            <FiBriefcase aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{client.name}</span>
            <FiArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
          </Link>
          <h1 className="mt-3 max-w-4xl break-words text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
            {project.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <RecordBadge status={projectStatus} />
            {project.environment && (
              <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-medium capitalize text-[#5b4d47]">
                {project.environment}
              </span>
            )}
            {project.deliveredAt && (
              <RecordBadge
                status={projectStatus === "done" ? "due-done" : "due-later"}
                label={
                  <>
                    <FiCalendar aria-hidden="true" className="size-3.5" />
                    Delivered{" "}
                    <time dateTime={project.deliveredAt.toISOString()}>
                      {formatDateTime(project.deliveredAt)}
                    </time>
                  </>
                }
              />
            )}
            {project.deadline && (
              <RecordBadge
                status={
                  projectStatus === "done"
                    ? "due-later"
                    : projectDueState === "overdue"
                      ? "due-overdue"
                      : projectDueState === "today" ||
                          projectDueState === "soon"
                        ? "due-soon"
                        : "due-later"
                }
                label={
                  <>
                    <FiCalendar aria-hidden="true" className="size-3.5" />
                    Due{" "}
                    <time dateTime={project.deadline.toISOString()}>
                      {formatDateTime(project.deadline)}
                    </time>
                    {projectStatus !== "done" &&
                      projectDueState === "overdue" && (
                        <span> · Invalid date - fix it</span>
                      )}
                  </>
                }
              />
            )}
          </div>
        </div>
        <div className="flex sm:flex-col items-end gap-3 flex-row">
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
          <ProjectActions
            client={{ _id: clientId, name: client.name }}
            project={{
              ...project,
              _id: String(project._id),
              clientId,
              status: projectStatus,
              deadline: project.deadline?.toISOString(),
              deliveredAt: project.deliveredAt?.toISOString(),
              technicalDetails: project.technicalDetails ?? undefined,
              deliveryDetails: project.deliveryDetails ?? undefined,
              repositoryUrl: project.repositoryUrl ?? undefined,
              environment: project.environment ?? undefined,
              productionUrl: project.productionUrl ?? undefined,
              stagingUrl: project.stagingUrl ?? undefined,
              notes: project.notes ?? undefined,
            }}
          />
        </div>
      </header>

      <section
        aria-labelledby="project-details-heading"
        className="mt-6 rounded-2xl border border-black/10 bg-white p-5"
      >
        <h2 id="project-details-heading" className="text-lg font-semibold">
          Project details
        </h2>
        <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <ProjectDetail label="Environment" value={project.environment} />
          <ProjectDetail
            label="Deadline date and time"
            value={formatDateTime(project.deadline)}
            dateTime={project.deadline?.toISOString()}
          />
          <ProjectDetail
            label="Delivered date and time"
            value={formatDateTime(project.deliveredAt)}
            dateTime={project.deliveredAt?.toISOString()}
            valueClassName={
              projectStatus === "done"
                ? "font-medium text-emerald-700"
                : undefined
            }
          />
          <ProjectDetail
            label="Repository"
            value={project.repositoryUrl}
            href={safeExternalUrl(project.repositoryUrl)}
          />
          <ProjectDetail
            label="Production URL"
            value={project.productionUrl}
            href={safeExternalUrl(project.productionUrl)}
          />
          <ProjectDetail
            label="Staging URL"
            value={project.stagingUrl}
            href={safeExternalUrl(project.stagingUrl)}
          />
          <ProjectDetail
            label="Technical details"
            value={project.technicalDetails}
          />
          <ProjectDetail
            label="Delivery details"
            value={project.deliveryDetails}
          />
          <ProjectDetail label="Notes" value={project.notes} />
        </dl>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href={`${canonicalPath}/secrets`}
          className="rounded-2xl border border-black/10 bg-white p-5 hover:border-[#602329]"
        >
          <FiKey aria-hidden="true" className="text-[#602329]" />
          <p className="mt-3 text-2xl font-semibold">{secretCount}</p>
          <p className="text-sm text-black/50">Secrets</p>
        </Link>
        <Link
          href={`${canonicalPath}/documents`}
          className="rounded-2xl border border-black/10 bg-white p-5 hover:border-[#602329]"
        >
          <FiFileText aria-hidden="true" className="text-[#602329]" />
          <p className="mt-3 text-2xl font-semibold">{documentCount}</p>
          <p className="text-sm text-black/50">Documents</p>
        </Link>
        <Link
          href={`${canonicalPath}/payments`}
          className="rounded-2xl border border-black/10 bg-white p-5 hover:border-[#602329]"
        >
          <FiCreditCard aria-hidden="true" className="text-[#602329]" />
          <p className="mt-3 text-2xl font-semibold">{paymentCount}</p>
          <p className="text-sm text-black/50">Payments</p>
        </Link>
      </div>
      <div className="mt-6">
        <TaskList
          projectId={String(project._id)}
          initialTasks={tasks.map((task) => ({
            _id: String(task._id),
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate?.toISOString() ?? null,
            notesPreview:
              task.notes?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "",
            completedAt: task.completedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}

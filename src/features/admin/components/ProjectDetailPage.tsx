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
import ProjectDialog from "@/features/admin/components/ProjectDialog";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { Secret } from "@/features/admin/models/secret";
import { ClientDocument } from "@/features/admin/models/document";
import { PaymentRecord } from "@/features/admin/models/payment";
import { connectToDatabase } from "@/lib/mongodb";
import DeleteRowAction from "./DeleteRowAction";

export default async function ProjectDetailPage({
  projectId,
}: {
  projectId: string;
}) {
  await connectToDatabase();
  const project = await Project.findById(projectId).lean();
  if (!project) notFound();
  const [client, tasks, secretCount, documentCount, paymentCount] =
    await Promise.all([
      Client.findById(project.clientId).select("_id name"),
      Task.find({ projectId: project._id })
        .sort({ status: 1, dueDate: 1 })
        .lean(),
      Secret.countDocuments({
        clientId: project.clientId,
        projectId: project._id,
      }),
      ClientDocument.countDocuments({
        clientId: project.clientId,
        projectId: project._id,
      }),
      PaymentRecord.countDocuments({
        clientId: project.clientId,
        projectId: project._id,
      }),
    ]);
  if (!client) notFound();
  const clientId = String(client._id);
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
            {project.environment && (
              <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-medium capitalize text-[#5b4d47]">
                {project.environment}
              </span>
            )}
            {project.deadline && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1 text-xs text-black/65">
                <FiCalendar aria-hidden="true" className="size-3.5" />
                Due {project.deadline.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProjectDialog
            label="Edit project"
            clients={[{ _id: clientId, name: client.name }]}
            project={{
              ...project,
              _id: String(project._id),
              clientId,
              deadline: project.deadline?.toISOString().slice(0, 10),
              technicalDetails: project.technicalDetails ?? undefined,
              deliveryDetails: project.deliveryDetails ?? undefined,
              repositoryUrl: project.repositoryUrl ?? undefined,
              environment: project.environment ?? undefined,
              productionUrl: project.productionUrl ?? undefined,
              stagingUrl: project.stagingUrl ?? undefined,
              notes: project.notes ?? undefined,
            }}
          />
          <DeleteRowAction
            endpoint={`/api/admin/projects/${project._id}`}
            label={`Delete ${project.name}`}
            description="Archive this project and all of its tasks, secrets, documents, and payments."
            redirectTo={`/admin/clients/${clientId}`}
          />
        </div>
      </header>
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
            dueDate: task.dueDate?.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}

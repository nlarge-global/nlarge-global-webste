import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FiCreditCard, FiFileText, FiKey } from "react-icons/fi";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ProjectForm from "@/features/admin/components/ProjectForm";
import TaskList from "@/features/admin/components/TaskList";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";
import { connectToDatabase } from "@/lib/mongodb";
import { Secret } from "@/features/admin/models/secret";
import { ClientDocument } from "@/features/admin/models/document";
import { PaymentRecord } from "@/features/admin/models/payment";
import SecretManager from "@/features/admin/components/SecretManager";
import DocumentManager from "@/features/admin/components/DocumentManager";
import PaymentManager from "@/features/admin/components/PaymentManager";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { id } = await params;
  await connectToDatabase();
  const project = await Project.findById(id).lean();
  if (!project) notFound();
  const [client, tasks, secretCount, documentCount, paymentCount] = await Promise.all([
    Client.findById(project.clientId).select("_id name"),
    Task.find({ projectId: project._id }).sort({ status: 1, dueDate: 1 }).lean(),
    Secret.countDocuments({ clientId: project.clientId }),
    ClientDocument.countDocuments({ clientId: project.clientId }),
    PaymentRecord.countDocuments({ clientId: project.clientId }),
  ]);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-black/45"><Link href="/admin">Admin</Link><span>/</span><Link href="/admin/clients">Clients</Link><span>/</span>{client && <Link href={`/admin/clients/${client._id}`}>{client.name}</Link>}<span>/</span><span className="text-black/75">{project.name}</span></nav>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">{project.name}</h1>
      <p className="mt-2 text-sm text-black/55">Client: {client?.name ?? "Unknown client"}</p>
      <div className="mt-6"><ProjectForm clients={client ? [{ _id: String(client._id), name: client.name }] : []} project={{ ...project, _id: String(project._id), clientId: String(project.clientId), deadline: project.deadline?.toISOString().slice(0, 10), technicalDetails: project.technicalDetails ?? undefined, deliveryDetails: project.deliveryDetails ?? undefined, repositoryUrl: project.repositoryUrl ?? undefined, environment: project.environment ?? undefined, productionUrl: project.productionUrl ?? undefined, stagingUrl: project.stagingUrl ?? undefined, notes: project.notes ?? undefined }} /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href={`/admin/clients/${project.clientId}/secrets`} className="rounded-2xl border border-black/10 bg-white p-5 hover:border-[#602329]"><FiKey className="text-[#602329]" /><p className="mt-3 text-2xl font-semibold">{secretCount}</p><p className="text-sm text-black/50">Secrets</p></Link>
        <Link href={`/admin/clients/${project.clientId}/documents`} className="rounded-2xl border border-black/10 bg-white p-5 hover:border-[#602329]"><FiFileText className="text-[#602329]" /><p className="mt-3 text-2xl font-semibold">{documentCount}</p><p className="text-sm text-black/50">Documents</p></Link>
        <Link href={`/admin/clients/${project.clientId}/payments`} className="rounded-2xl border border-black/10 bg-white p-5 hover:border-[#602329]"><FiCreditCard className="text-[#602329]" /><p className="mt-3 text-2xl font-semibold">{paymentCount}</p><p className="text-sm text-black/50">Payments</p></Link>
      </div>
      <div className="mt-6"><TaskList projectId={String(project._id)} initialTasks={tasks.map((task) => ({ _id: String(task._id), title: task.title, status: task.status, priority: task.priority, dueDate: task.dueDate?.toISOString() }))} /></div>
    </div>
  );
}

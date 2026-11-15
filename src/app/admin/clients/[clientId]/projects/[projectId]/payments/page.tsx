import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentManager from "@/features/admin/components/PaymentManager";
import Link from "next/link";
import { FiArrowUpRight, FiCreditCard } from "react-icons/fi";

export default async function ProjectPaymentsPage({ params }: { params: Promise<{ clientId: string; projectId: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { clientId, projectId } = await params;
  await connectToDatabase();
  const [client, project] = await Promise.all([Client.findById(clientId).select("_id name").lean(), Project.findOne({ _id: projectId, clientId }).select("_id name").lean()]);
  if (!client || !project) notFound();
  return (
    <div>
      <header className="border-b border-black/10 pb-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-black/50">
          <Link href={`/admin/clients/${clientId}`} className="hover:text-[#602329] hover:underline">{client.name}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/admin/clients/${clientId}/projects/${projectId}`} className="inline-flex items-center gap-1 hover:text-[#602329] hover:underline">
            {project.name}<FiArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </nav>
        <div className="mt-4 flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329]">
            <FiCreditCard aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Payments</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Track payment records and milestones for {project.name}.</p>
          </div>
        </div>
      </header>
      <PaymentManager clientId={clientId} projectId={projectId} />
    </div>
  );
}

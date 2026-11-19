import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentManager from "@/features/admin/components/PaymentManager";
import Link from "next/link";
import { FiArrowUpRight, FiCreditCard } from "react-icons/fi";

export default async function ProjectPaymentsPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { clientId, projectId } = await params;
  await connectToDatabase();
  const [client, project] = await Promise.all([
    Client.findById(clientId).select("_id name").lean(),
    Project.findOne({ _id: projectId, clientId }).select("_id name").lean(),
  ]);
  if (!client || !project) notFound();
  return (
    <div>
      <header className="border-b border-black/10 pb-6">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden text-xs text-black/50 sm:gap-2 sm:text-sm"
        >
          <Link
            href={`/admin/clients/${clientId}`}
            title={client.name}
            className="max-w-20 shrink-0 truncate hover:text-[#602329] hover:underline sm:max-w-none"
          >
            {client.name}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}`}
            title={project.name}
            className="inline-flex min-w-0 items-center gap-1 truncate hover:text-[#602329] hover:underline"
          >
            {project.name}
            <FiArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </nav>
        <div className="mt-3  sm:mt-4 sm:gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329] sm:size-11">
              <FiCreditCard aria-hidden="true" className="size-5" />
            </span>
            <h1 className="break-words text-2xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Payments
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-black/55 sm:mt-2 sm:text-sm sm:leading-6">
            Track payment records for {project.name} in chronological order.
          </p>
        </div>
      </header>
      <PaymentManager clientId={clientId} projectId={projectId} />
    </div>
  );
}

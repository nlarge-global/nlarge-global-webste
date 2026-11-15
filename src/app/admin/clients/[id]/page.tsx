import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiBriefcase, FiPlus } from "react-icons/fi";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ClientForm from "@/features/admin/components/ClientForm";
import { Client } from "@/features/admin/models/client";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/features/admin/models/project";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { id } = await params;
  await connectToDatabase();
  const client = await Client.findById(id).lean();
  if (!client) notFound();
  const [inquiries, projects] = await Promise.all([
    Inquiry.find({ clientId: client._id }).sort({ createdAt: -1 }).lean(),
    Project.find({ clientId: client._id }).sort({ createdAt: -1 }).lean(),
  ]);
  return (
    <div>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">{client.name}</h1>
      <p className="mt-2 text-sm text-black/55">Manage this client’s projects and related operational records.</p>
      <div className="mt-6"><ClientForm client={{ ...client, _id: String(client._id), email: client.email ?? undefined, company: client.company ?? undefined, phone: client.phone ?? undefined, notes: client.notes ?? undefined }} /></div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Projects</h2><Link href="/admin/projects" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#602329] px-3 text-xs font-semibold text-white"><FiPlus />Add project</Link></div>
        <div className="mt-4 divide-y divide-black/10">{projects.length === 0 && <p className="py-5 text-sm text-black/50">No projects yet.</p>}{projects.map((project) => <Link key={String(project._id)} href={`/admin/projects/${project._id}`} className="flex items-center justify-between gap-3 py-4 hover:text-[#602329]"><span><span className="block font-medium">{project.name}</span><span className="mt-1 block text-sm text-black/50">{project.environment || "No environment"}{project.deadline ? ` · due ${project.deadline.toLocaleDateString()}` : ""}</span></span><FiBriefcase aria-hidden="true" /></Link>)}</div>
      </section>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Linked inquiries</h2>
        <div className="mt-4 divide-y divide-black/10">
          {inquiries.length === 0 && <p className="py-5 text-sm text-black/50">No inquiries linked.</p>}
          {inquiries.map((inquiry) => <Link key={String(inquiry._id)} href={`/admin/inquiries/${inquiry._id}`} className="block py-4 hover:text-[#602329]"><p className="font-medium">{inquiry.subject}</p><p className="mt-1 text-sm text-black/50">{inquiry.status} · {inquiry.email}</p></Link>)}
        </div>
      </section>
      <p className="mt-6 text-sm text-black/50">Secrets, documents, and payments are managed from each project dashboard.</p>
    </div>
  );
}

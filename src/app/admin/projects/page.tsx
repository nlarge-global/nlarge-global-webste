import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ProjectForm from "@/features/admin/components/ProjectForm";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";

export default async function ProjectsPage() {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const [clients, projects] = await Promise.all([Client.find().select("_id name").sort({ name: 1 }).lean(), Project.find().sort({ createdAt: -1 }).lean()]);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Projects</h1>
      <p className="mt-2 text-sm text-black/55">Keep technical and delivery details separate from the client profile.</p>
      <div className="mt-6"><ProjectForm clients={clients.map((client) => ({ _id: String(client._id), name: client.name }))} /></div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Project records</h2>
        <div className="mt-4 divide-y divide-black/10">
          {projects.length === 0 && <p className="py-5 text-sm text-black/50">No projects yet.</p>}
          {projects.map((project) => <Link key={String(project._id)} href={`/admin/projects/${project._id}`} className="block py-4 hover:text-[#602329]"><p className="font-medium">{project.name}</p><p className="mt-1 text-sm text-black/50">{String(project.clientId)}{project.environment ? ` · ${project.environment}` : ""}</p></Link>)}
        </div>
      </section>
    </div>
  );
}

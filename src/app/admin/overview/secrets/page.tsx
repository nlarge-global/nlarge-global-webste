import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Secret } from "@/features/admin/models/secret";
import { Project } from "@/features/admin/models/project";
import { Client } from "@/features/admin/models/client";
import Pagination from "@/features/admin/components/Pagination";
import { Card } from "@/components/ui/card";

const PAGE_SIZE = 10;

export default async function OverviewSecretsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const page = Math.max(1, Number((await searchParams).page || 1));
  const now = new Date();
  const filter = { expiresAt: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } };
  const [secrets, total] = await Promise.all([
    Secret.find(filter).sort({ expiresAt: 1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).select("label type expiresAt clientId projectId").lean(),
    Secret.countDocuments(filter),
  ]);
  const clientIds = secrets.map((secret) => secret.clientId);
  const projectIds = secrets.flatMap((secret) => secret.projectId ? [secret.projectId] : []);
  const [clients, projects] = await Promise.all([
    Client.find({ _id: { $in: clientIds } }).select("_id name").lean(),
    Project.find({ _id: { $in: projectIds } }).select("_id name clientId").lean(),
  ]);
  const clientMap = new Map(clients.map((client) => [String(client._id), client.name]));
  const projectMap = new Map(projects.map((project) => [String(project._id), project]));
  return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Expiring secrets</h1><p className="mt-2 text-sm text-black/55">Secrets expiring in the next 30 days.</p><Card className="mt-6 divide-y divide-black/10 p-5">{secrets.length === 0 && <p className="py-4 text-sm text-black/50">No secrets are expiring soon.</p>}{secrets.map((secret) => { const project = secret.projectId ? projectMap.get(String(secret.projectId)) : undefined; return <Link key={String(secret._id)} href={project ? `/admin/clients/${secret.clientId}/projects/${secret.projectId}/secrets` : "/admin/overview/secrets"} className="block py-4 first:pt-0 last:pb-0 hover:text-[#602329]"><p className="font-medium">{secret.label}</p><p className="mt-1 text-sm text-black/50">{clientMap.get(String(secret.clientId)) ?? "Unknown client"}{project ? ` · ${project.name}` : ""} · expires {secret.expiresAt?.toLocaleDateString()}</p></Link>; })}</Card><Pagination page={page} hasNext={page * PAGE_SIZE < total} basePath="/admin/overview/secrets" /></div>;
}

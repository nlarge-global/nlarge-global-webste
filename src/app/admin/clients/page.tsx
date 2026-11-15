import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ClientForm from "@/features/admin/components/ClientForm";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";

export default async function ClientsPage() {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const [clients, projectCounts] = await Promise.all([
    Client.find().sort({ createdAt: -1 }).lean(),
    Project.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$clientId", count: { $sum: 1 } } }]),
  ]);
  const counts = new Map(projectCounts.map((item) => [String(item._id), item.count]));
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Clients</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-black/55">Open a client to manage projects, inquiries, and operational records.</p><a href="#new-client" className="inline-flex min-h-10 items-center rounded-xl bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black">Add client</a></div>
      <div id="new-client" className="mt-6"><ClientForm /></div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Client records</h2><span className="text-sm text-black/45">{clients.length} total</span></div>
        <div className="mt-4 divide-y divide-black/10">
          {clients.length === 0 && <p className="py-5 text-sm text-black/50">No clients yet.</p>}
          {clients.map((client) => (
            <Link key={String(client._id)} href={`/admin/clients/${client._id}`} className="block py-4 hover:text-[#602329]">
              <p className="font-medium">{client.name}</p>
              <p className="mt-1 text-sm text-black/50">{client.company || client.email || "No company or email"} · {counts.get(String(client._id)) ?? 0} project{counts.get(String(client._id)) === 1 ? "" : "s"}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

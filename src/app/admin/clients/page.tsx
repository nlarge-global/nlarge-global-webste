import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ClientDialog from "@/features/admin/components/ClientDialog";
import { Client } from "@/features/admin/models/client";
import { connectToDatabase } from "@/lib/mongodb";
import Pagination from "@/features/admin/components/Pagination";

const PAGE_SIZE = 25;

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [clients, total] = await Promise.all([
    Client.find().sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Client.countDocuments(),
  ]);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Clients</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-black/55">Open a client to manage projects, inquiries, and operational records.</p><ClientDialog /></div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Client records</h2><span className="text-sm text-black/45">{clients.length} total</span></div>
        <div className="mt-4 divide-y divide-black/10">
          {clients.length === 0 && <p className="py-5 text-sm text-black/50">No clients yet.</p>}
          {clients.map((client) => (
            <Link key={String(client._id)} href={`/admin/clients/${client._id}`} className="block py-4 hover:text-[#602329]">
              <p className="font-medium">{client.name}</p>
              <p className="mt-1 text-sm text-black/50">{client.company || client.email || "No company or email"}</p>
            </Link>
          ))}
        </div>
        <Pagination page={page} hasNext={page * PAGE_SIZE < total} basePath="/admin/clients" />
      </section>
    </div>
  );
}

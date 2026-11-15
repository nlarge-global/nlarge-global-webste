import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ClientDialog from "@/features/admin/components/ClientDialog";
import { Client } from "@/features/admin/models/client";
import { connectToDatabase } from "@/lib/mongodb";
import Pagination from "@/features/admin/components/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        {clients.length === 0 ? <p className="mt-4 py-5 text-sm text-black/50">No clients yet.</p> : <Table className="mt-4"><TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{clients.map((client) => <TableRow key={String(client._id)}><TableCell><Link href={`/admin/clients/${client._id}`} className="font-medium text-[#602329] hover:underline">{client.name}</Link></TableCell><TableCell className="text-black/55">{client.company || client.email || "No company or email"}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><ClientDialog client={{ ...client, _id: String(client._id), email: client.email ?? undefined, company: client.company ?? undefined, phone: client.phone ?? undefined, notes: client.notes ?? undefined }} /></div></TableCell></TableRow>)}</TableBody></Table>}
        <Pagination page={page} hasNext={page * PAGE_SIZE < total} basePath="/admin/clients" />
      </section>
    </div>
  );
}

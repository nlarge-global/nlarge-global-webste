import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import DocumentManager from "@/features/admin/components/DocumentManager";
import { Client } from "@/features/admin/models/client";
import { connectToDatabase } from "@/lib/mongodb";

export default async function ClientDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { id } = await params;
  await connectToDatabase();
  const client = await Client.findById(id).select("_id name").lean();
  if (!client) notFound();
  return <div><h1 className="text-3xl font-semibold">Documents · {client.name}</h1><p className="mt-2 text-sm text-black/55">Private client files stored in R2.</p><DocumentManager clientId={String(client._id)} /></div>;
}

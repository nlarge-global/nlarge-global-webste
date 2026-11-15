import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentManager from "@/features/admin/components/PaymentManager";

export default async function ProjectPaymentsPage({ params }: { params: Promise<{ clientId: string; projectId: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { clientId, projectId } = await params;
  await connectToDatabase();
  const [client, project] = await Promise.all([Client.findById(clientId).select("_id name").lean(), Project.findOne({ _id: projectId, clientId }).select("_id name").lean()]);
  if (!client || !project) notFound();
  return <div><h1 className="text-3xl font-semibold">Payments · {project.name}</h1><p className="mt-2 text-sm text-black/55">Payment records for {client.name}.</p><PaymentManager clientId={clientId} projectId={projectId} /></div>;
}

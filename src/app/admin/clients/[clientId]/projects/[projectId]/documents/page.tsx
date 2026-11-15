import { isValidObjectId } from "mongoose";
import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { ClientDocument } from "@/features/admin/models/document";
import { Project } from "@/features/admin/models/project";
import DocumentManager from "@/features/admin/components/DocumentManager";
import { connectToDatabase } from "@/lib/mongodb";

const PAGE_SIZE = 10;

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { clientId, projectId } = await params;
  if (!isValidObjectId(clientId) || !isValidObjectId(projectId)) notFound();

  await connectToDatabase();
  if (!(await Project.exists({ _id: projectId, clientId }))) notFound();

  const query = await searchParams;
  const parsedPage = Number(query.page);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filter = { clientId, projectId };
  const [documents, total] = await Promise.all([
    ClientDocument.find(filter)
      .select("filename description contentType size createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    ClientDocument.countDocuments(filter),
  ]);

  return (
    <DocumentManager
      clientId={clientId}
      projectId={projectId}
      documents={documents.map((document) => ({
        ...document,
        _id: String(document._id),
        createdAt: new Date(document.createdAt).toISOString(),
      }))}
      page={page}
      total={total}
    />
  );
}

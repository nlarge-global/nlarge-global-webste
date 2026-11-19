import { isValidObjectId } from "mongoose";
import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { ClientDocument } from "@/features/admin/models/document";
import { Project } from "@/features/admin/models/project";
import DocumentManager from "@/features/admin/components/DocumentManager";
import { connectToDatabase } from "@/lib/mongodb";
import AdminListFilters from "@/features/admin/components/AdminListFilters";
import { getArchiveQuery, includesArchived, parseArchiveFilter } from "@/features/admin/services/archive-filter";

const PAGE_SIZE = 10;

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
  searchParams: Promise<{ page?: string; archive?: string }>;
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
  const archive = parseArchiveFilter(query.archive);
  const filter = { clientId, projectId, ...getArchiveQuery(archive) };
  const options = { includeDeleted: includesArchived(archive) };
  const [documents, total] = await Promise.all([
    ClientDocument.find(filter)
      .setOptions(options)
      .select("filename contentType createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    ClientDocument.countDocuments(filter).setOptions(options),
  ]);

  return (
    <DocumentManager
      clientId={clientId}
      projectId={projectId}
      documents={documents.map((document) => ({
        _id: String(document._id),
        filename: document.filename,
        contentType: document.contentType,
        createdAt: new Date(document.createdAt).toISOString(),
        ...(document.updatedAt
          ? { updatedAt: new Date(document.updatedAt).toISOString() }
          : {}),
      }))}
      page={page}
      total={total}
      archive={archive}
    />
  );
}

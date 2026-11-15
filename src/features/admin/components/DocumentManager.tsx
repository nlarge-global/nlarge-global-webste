import { FiFileText, FiImage } from "react-icons/fi";
import { AdminPagination } from "@/components/ui/pagination";
import DocumentActions from "./DocumentActions";
import DocumentUploadDialog from "./DocumentUploadDialog";

export type DocumentRecord = {
  _id: string;
  filename: string;
  description?: string;
  contentType: string;
  size: number;
  createdAt: string;
};

export default function DocumentManager({
  clientId,
  projectId,
  documents,
  page,
  total,
}: {
  clientId: string;
  projectId: string;
  documents: DocumentRecord[];
  page: number;
  total: number;
}) {
  const pageSize = 10;

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Documents
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Private project files. PDF, PNG, and JPEG uploads up to 10 MB.
          </p>
        </div>
        <DocumentUploadDialog clientId={clientId} projectId={projectId} />
      </header>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-4">
          <h2 className="font-semibold">Project files</h2>
          <span className="text-sm tabular-nums text-black/55">
            {total} {total === 1 ? "file" : "files"}
          </span>
        </div>
        <div aria-label="Project documents" className="divide-y divide-black/10">
          {documents.length === 0 ? (
            <div className="py-12 text-center">
              <FiFileText
                aria-hidden="true"
                className="mx-auto size-6 text-black/35"
              />
              <p className="mt-3 font-medium">No documents uploaded</p>
              <p className="mt-1 text-sm text-black/55">
                Upload a PDF or image to keep it with this project.
              </p>
            </div>
          ) : (
            documents.map((document) => (
              <DocumentRow
                key={document._id}
                clientId={clientId}
                document={document}
              />
            ))
          )}
        </div>
        <AdminPagination
          page={page}
          total={total}
          pageSize={pageSize}
          basePath={`/admin/clients/${clientId}/projects/${projectId}/documents`}
        />
      </section>
    </div>
  );
}

function DocumentRow({
  clientId,
  document,
}: {
  clientId: string;
  document: DocumentRecord;
}) {
  const FileIcon = document.contentType.startsWith("image/")
    ? FiImage
    : FiFileText;

  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#602329]/8 text-[#602329]">
          <FileIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="break-words font-medium">{document.filename}</p>
          <p className="mt-1 break-words text-sm text-black/55">
            {document.description || "No description"}
          </p>
          <p className="mt-2 text-xs tabular-nums text-black/45">
            {document.contentType.split("/").pop()?.toUpperCase()} ·{" "}
            {document.size < 1024 * 1024
              ? `${Math.max(1, Math.ceil(document.size / 1024))} KB`
              : `${(document.size / (1024 * 1024)).toFixed(1)} MB`}{" "}
            · {new Date(document.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <DocumentActions clientId={clientId} document={document} />
    </div>
  );
}

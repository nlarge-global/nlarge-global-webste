"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiFileText, FiImage } from "react-icons/fi";
import { AdminPagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/features/admin/services/date-time";
import { getDisplayErrorMessage } from "@/lib/error-message";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import RecordActionsMenu from "./RecordActionsMenu";
import { Button } from "./ui/Button";
import { deleteAdminRecord, type DeleteMode } from "./admin-delete";
import AdminListFilters from "./AdminListFilters";
import type { ArchiveFilter } from "@/features/admin/services/archive-filter";

export type DocumentRecord = {
  _id: string;
  filename: string;
  description?: string;
  tags?: string[];
  contentType: string;
  size?: number;
  createdAt: string;
  updatedAt?: string;
};

const DocumentFormDialog = dynamic(() => import("./DocumentFormDialog"), {
  ssr: false,
});
const DocumentDetailsDialog = dynamic(() => import("./DocumentDetailsDialog"), {
  ssr: false,
  loading: () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label="Loading document details"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg space-y-3 rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
        <div className="h-6 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="h-16 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="h-12 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      </div>
    </div>
  ),
});

const pageSize = 10;

export default function DocumentManager({
  clientId,
  projectId,
  documents: initialDocuments,
  page,
  total,
  archive = "active",
}: {
  clientId: string;
  projectId: string;
  documents: DocumentRecord[];
  page: number;
  total: number;
  archive?: ArchiveFilter;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentCount, setDocumentCount] = useState(total);
  const [formDocument, setFormDocument] = useState<
    DocumentRecord | null | "new"
  >(null);
  const [detailsDocument, setDetailsDocument] = useState<DocumentRecord | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDocument, setDeleteDocument] = useState<DocumentRecord | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => setDocuments(initialDocuments), [initialDocuments]);
  useEffect(() => setDocumentCount(total), [total]);

  async function save(
    formData: FormData,
    document?: DocumentRecord,
    onProgress?: (percent: number) => void,
  ) {
    const previousDocument = document
      ? documents.find((item) => item._id === document._id)
      : undefined;
    const temporaryId = document ? undefined : `upload-${crypto.randomUUID()}`;
    if (temporaryId) {
      setDocumentCount((count) => count + 1);
      const file = formData.get("file");
      if (file instanceof File) {
        setDocuments((current) => [
          {
            _id: temporaryId,
            filename: String(formData.get("filename") || file.name),
            contentType: file.type || "application/octet-stream",
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      }
    } else if (document) {
      setDocuments((current) =>
        current.map((item) =>
          item._id === document._id
            ? {
                ...item,
                filename: String(formData.get("filename")),
                description: String(formData.get("description")),
                tags: String(formData.get("tags"))
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }
            : item,
        ),
      );
    }

    try {
      const csrfToken = documentCookieToken();
      formData.set("projectId", projectId);
      const response = await new Promise<{
        ok: boolean;
        json: () => Promise<{
          error?: string;
          document?: DocumentRecord;
        }>;
      }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(
          document ? "PATCH" : "POST",
          document
            ? `/api/admin/clients/${clientId}/documents/${document._id}`
            : `/api/admin/clients/${clientId}/documents`,
        );
        if (csrfToken) request.setRequestHeader("x-csrf-token", csrfToken);
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.(Math.round((event.loaded / event.total) * 100));
          }
        };
        request.onerror = () =>
          reject(new Error("Unable to reach the server."));
        request.onload = () => {
          let result: { error?: string; document?: DocumentRecord };
          try {
            result = JSON.parse(request.responseText) as typeof result;
          } catch {
            reject(new Error("The server returned an invalid response."));
            return;
          }
          resolve({
            ok: request.status >= 200 && request.status < 300,
            json: async () => result,
          });
        };
        request.send(formData);
      });
      const result = (await response.json()) as {
        error?: string;
        document?: DocumentRecord;
      };
      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to save document.");
      }
      if (temporaryId) {
        setDocuments((current) =>
          current.map((item) =>
            item._id === temporaryId ? result.document! : item,
          ),
        );
      } else {
        setDocuments((current) =>
          current.map((item) =>
            item._id === document?._id ? result.document! : item,
          ),
        );
      }

      setFormDocument(null);
      toast.success(document ? "Document updated." : "Document uploaded.");
      router.refresh();
      return null;
    } catch (reason) {
      if (temporaryId) {
        setDocuments((current) =>
          current.filter((item) => item._id !== temporaryId),
        );
        setDocumentCount((count) => Math.max(0, count - 1));
      } else if (document) {
        setDocuments((current) =>
          current.map((item) =>
            item._id === document._id && previousDocument
              ? previousDocument
              : item,
          ),
        );
      }
      const message = getDisplayErrorMessage(
        reason,
        "Unable to save document.",
      );
      return message;
    }
  }

  async function loadDetails(document: DocumentRecord) {
    setDetailsLoading(true);
    setDetailsDocument(document);
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/documents/${document._id}?details=true`,
      );
      const result = (await response.json()) as {
        document?: DocumentRecord;
        error?: string;
      };
      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to load document details.");
      }
      setDetailsDocument(result.document);
    } catch (reason) {
      setDetailsDocument(null);
      toast.error(
        getDisplayErrorMessage(reason, "Unable to load document details."),
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function editDocument(document: DocumentRecord) {
    setEditLoading(true);
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/documents/${document._id}?details=true`,
      );
      const result = (await response.json()) as {
        document?: DocumentRecord;
        error?: string;
      };
      if (!response.ok || !result.document) {
        throw new Error(result.error ?? "Unable to load document details.");
      }
      setFormDocument(result.document);
    } catch (reason) {
      toast.error(getDisplayErrorMessage(reason, "Unable to edit document."));
    } finally {
      setEditLoading(false);
    }
  }

  async function openDocument(document: DocumentRecord) {
    const openedWindow = window.open("", "_blank");
    if (!openedWindow) {
      toast.error("Allow pop-ups to open this document.");
      return;
    }
    openedWindow.opener = null;
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/documents/${document._id}?download=true`,
      );
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to open document.");
      }
      const url = URL.createObjectURL(await response.blob());
      openedWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (reason) {
      openedWindow.close();
      toast.error(getDisplayErrorMessage(reason, "Unable to open document."));
    }
  }

  async function remove(document: DocumentRecord, mode: DeleteMode) {
    const index = documents.findIndex((item) => item._id === document._id);
    setDocuments((current) =>
      current.filter((item) => item._id !== document._id),
    );
    setDocumentCount((count) => Math.max(0, count - 1));
    try {
      await deleteAdminRecord(
        `/api/admin/clients/${clientId}/documents/${document._id}`,
        document._id,
        mode,
        "Unable to delete document.",
      );
      setDeleteDocument(null);
      toast.success(
        mode === "permanent"
          ? "Document permanently deleted."
          : "Document archived.",
      );
      router.refresh();
    } catch (reason) {
      setDocuments((current) => {
        const restored = [...current];
        restored.splice(Math.max(0, index), 0, document);
        return restored;
      });
      setDocumentCount((count) => count + 1);
      const message = getDisplayErrorMessage(
        reason,
        "Unable to delete document.",
      );
      throw new Error(message);
    }
  }

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Documents
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Private project files. PDF, PNG, JPEG, ZIP, and TXT with per-type
            size limits.
          </p>
        </div>
        <Button type="button" onClick={() => setFormDocument("new")}>
          Upload document
        </Button>
      </header>

      <section className=" flex items-center justify-between gap-2 border border-black/10 bg-white rounded-2xl mt-2 p-2">
        <div className="text-sm text-gray-500">Search Box Placeholder</div>
        <AdminListFilters
          fields={[
            {
              name: "archive",
              label: "Records",
              value: archive,
              options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
                { value: "all", label: "All records" },
              ],
            },
          ]}
        />
      </section>

      <section className="mt-2 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-4">
          <h2 className="font-semibold">Project files</h2>
          <span className="text-sm tabular-nums text-black/55">
            {documentCount} {documentCount === 1 ? "file" : "files"}
          </span>
        </div>
        <div
          aria-label="Project documents"
          className="divide-y divide-black/10"
        >
          {documents.length === 0 ? (
            <div className="py-12 text-center">
              <FiFileText
                aria-hidden="true"
                className="mx-auto size-6 text-black/35"
              />
              <p className="mt-3 font-medium">No documents uploaded</p>
              <p className="mt-1 text-sm text-black/55">
                Upload a PDF, image, ZIP, or text file to keep it with this
                project.
              </p>
            </div>
          ) : (
            documents.map((document) => {
              const FileIcon = document.contentType.startsWith("image/")
                ? FiImage
                : FiFileText;
              return (
                <article
                  key={document._id}
                  className="flex min-w-0 items-center justify-between gap-3 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#602329]/8 text-[#602329]">
                      <FileIcon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-all font-medium">
                        {document.filename}
                      </p>
                      <p className="mt-1 text-xs text-black/55">
                        {document.contentType.split("/").pop()?.toUpperCase()} ·{" "}
                        {formatDateTime(document.createdAt)}
                      </p>
                    </div>
                  </div>
                  {document._id.startsWith("upload-") ? (
                    <span
                      role="status"
                      className="shrink-0 text-xs font-medium text-[#602329]"
                    >
                      Uploading…
                    </span>
                  ) : (
                    <RecordActionsMenu
                      label={`document ${document.filename}`}
                      reveal={{
                        title: `Open ${document.filename}`,
                        onSelect: () => void openDocument(document),
                      }}
                      revealLabel="Open file"
                      details={{ onSelect: () => void loadDetails(document) }}
                      edit={{ onSelect: () => void editDocument(document) }}
                      delete={{ onSelect: () => setDeleteDocument(document) }}
                    />
                  )}
                </article>
              );
            })
          )}
        </div>
        <AdminPagination
          page={page}
          total={documentCount}
          pageSize={pageSize}
          basePath={`/admin/clients/${clientId}/projects/${projectId}/documents`}
          queryParams={{ archive }}
        />
      </section>
      {editLoading && (
        <div
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label="Loading document for editing"
          className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
        >
          <div className="w-full max-w-lg space-y-3 rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
            <div className="h-6 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-20 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          </div>
        </div>
      )}
      {formDocument && (
        <DocumentFormDialog
          document={formDocument === "new" ? undefined : formDocument}
          onClose={() => setFormDocument(null)}
          onSubmit={save}
        />
      )}
      {detailsDocument && (
        <DocumentDetailsDialog
          document={detailsDocument}
          loading={detailsLoading}
          onOpenFile={() => void openDocument(detailsDocument)}
          onClose={() => setDetailsDocument(null)}
        />
      )}
      {deleteDocument && (
        <DeleteConfirmationDialog
          label={`Delete ${deleteDocument.filename}`}
          description="Archive this document while retaining its private object for troubleshooting."
          onConfirm={(mode) => remove(deleteDocument, mode)}
          onRecovery={() => setDeleteDocument(deleteDocument)}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteDocument(null);
          }}
          trigger={null}
        />
      )}
    </div>
  );
}

function documentCookieToken() {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
    ?.split("=")[1];
  return value ? decodeURIComponent(value) : undefined;
}

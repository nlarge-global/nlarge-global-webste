"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "./ui/Button";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { useDialogEscape } from "./useDialogEscape";

type DocumentRecord = { _id: string; filename: string; description?: string; contentType: string; size: number; createdAt: string };
const pageSize = 10;

export default function DocumentManager({ clientId, projectId }: { clientId: string; projectId?: string }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => fetch(`/api/admin/clients/${clientId}/documents${projectId ? `?projectId=${projectId}` : ""}`).then(async (response) => {
    const result = await response.json() as { documents?: DocumentRecord[]; pagination?: { total: number }; error?: string };
    if (response.ok) { setDocuments(result.documents ?? []); setTotal(result.pagination?.total ?? 0); }
    else setError(result.error ?? "Unable to load documents.");
  }).catch(() => setError("Unable to load documents."));
  useEffect(() => { void load();   }, [clientId, projectId, page]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (projectId) formData.set("projectId", projectId);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/documents`, {
      method: "POST",
      headers: csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : undefined,
      body: formData,
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to upload document.");
    else { event.currentTarget.reset(); setError(""); void load(); }
  }

  async function openDocument(documentId: string) {
    const response = await fetch(`/api/admin/clients/${clientId}/documents/${documentId}`);
    const result = await response.json() as { url?: string; error?: string };
    if (response.ok && result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    else setError(result.error ?? "Unable to open document.");
  }

  async function deleteDocument(documentId: string) {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/documents/${documentId}`, {
      method: "DELETE",
      headers: { "x-confirm-delete": documentId, ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to delete document.");
    else { setError(""); setDocuments((current) => current.filter((document) => document._id !== documentId)); }
  }

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
      <div><h2 className="font-semibold">Private documents</h2><p className="mt-1 text-sm text-black/50">Only validated PDF and image files are accepted.</p></div>
      <DocumentUploadDialog onSubmit={upload} />
      <div className="mt-5 divide-y divide-black/10">
        {documents.length === 0 && <p className="py-4 text-sm text-black/50">No documents uploaded.</p>}
        {documents.map((document) => <DocumentRow key={document._id} document={document} onOpen={() => void openDocument(document._id)} onDelete={() => void deleteDocument(document._id)} />)}
      </div>
      {total > pageSize && <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm"><span>Page {page}</span><div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
    </section>
  );
}

function DocumentUploadDialog({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialogEscape(open, () => setOpen(false));
  return <><Button type="button" className="mt-5" onClick={() => setOpen(true)}>Upload document</Button>{open && <div ref={dialogRef} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-document-title"><form onSubmit={(event) => { onSubmit(event); setOpen(false); }} className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 id="upload-document-title" className="text-xl font-semibold">Upload document</h2><label className="mt-4 block text-sm font-medium">Filename<input name="filename" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label><label className="mt-3 block text-sm font-medium">File<input name="file" type="file" accept=".pdf,image/png,image/jpeg" required className="mt-2 block min-h-11 w-full rounded-xl border border-black/15 p-2 text-sm" /></label><label className="mt-3 block text-sm font-medium">Description<textarea name="description" rows={2} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Upload</Button></div></form></div>}</>;
}

function DocumentRow({ document, onOpen, onDelete }: { document: DocumentRecord; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div><p className="font-medium">{document.filename}</p><p className="mt-1 text-xs text-black/50">{document.description || "No description"} · {Math.ceil(document.size / 1024)} KB · {new Date(document.createdAt).toLocaleDateString()}</p></div>
      <div className="flex items-center gap-2"><Button type="button" onClick={onOpen} variant="outline" size="sm">Open</Button><DeleteConfirmationDialog label={`Delete ${document.filename}`} description="Archive this document while retaining its private object for troubleshooting." onConfirm={onDelete} /></div>
    </div>
  );
}

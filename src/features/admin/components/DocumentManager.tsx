"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";

type DocumentRecord = { _id: string; filename: string; contentType: string; size: number; createdAt: string };

export default function DocumentManager({ clientId, projectId }: { clientId: string; projectId?: string }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState("");

  const load = () => fetch(`/api/admin/clients/${clientId}/documents${projectId ? `?projectId=${projectId}` : ""}`).then(async (response) => {
    const result = await response.json() as { documents?: DocumentRecord[]; error?: string };
    if (response.ok) setDocuments(result.documents ?? []);
    else setError(result.error ?? "Unable to load documents.");
  }).catch(() => setError("Unable to load documents."));
  useEffect(() => { void load();   }, [clientId, projectId]);

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
      <form onSubmit={upload} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-medium">Upload file<input name="file" type="file" accept=".pdf,image/png,image/jpeg" required className="mt-2 block min-h-11 w-full rounded-xl border border-black/15 p-2 text-sm" /></label>
        <Button type="submit">Upload</Button>
      </form>
      <div className="mt-5 divide-y divide-black/10">
        {documents.length === 0 && <p className="py-4 text-sm text-black/50">No documents uploaded.</p>}
        {documents.map((document) => <DocumentRow key={document._id} document={document} onOpen={() => void openDocument(document._id)} onDelete={() => void deleteDocument(document._id)} />)}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
    </section>
  );
}

function DocumentRow({ document, onOpen, onDelete }: { document: DocumentRecord; onOpen: () => void; onDelete: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => { timer.current = setTimeout(onDelete, 900); };
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div><p className="font-medium">{document.filename}</p><p className="mt-1 text-xs text-black/50">{Math.ceil(document.size / 1024)} KB · {new Date(document.createdAt).toLocaleDateString()}</p></div>
      <div className="flex items-center gap-2"><Button type="button" onClick={onOpen} variant="outline" size="sm">Open</Button><Button type="button" onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") start(); }} onKeyUp={stop} onBlur={stop} aria-label={`Hold to delete ${document.filename}`} variant="destructive" size="sm">Hold to delete</Button></div>
    </div>
  );
}

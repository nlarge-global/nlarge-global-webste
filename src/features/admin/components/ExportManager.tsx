"use client";

import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";

export default function ExportManager({ clients }: { clients: Array<{ _id: string; name: string }> }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch("/api/admin/exports", { method: "POST", headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) }, body: JSON.stringify({ clientId: form.get("clientId"), includeDocuments: form.get("includeDocuments") === "on" }) });
    const result = await response.json() as { downloadUrl?: string; error?: string };
    if (!response.ok) setError(result.error ?? "Unable to create export.");
    else { setUrl(result.downloadUrl ?? ""); setError(""); }
  }

  async function download() {
    const response = await fetch(url);
    const result = await response.json() as { url?: string; error?: string };
    if (response.ok && result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    else setError(result.error ?? "Export expired or could not be downloaded.");
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Client exports</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Exports exclude secrets. Document inclusion is explicit and downloads expire quickly.</p>
      <form onSubmit={create} className="mt-6 max-w-xl rounded-2xl border border-black/10 bg-white p-5">
        <label className="text-sm font-medium">Client<select name="clientId" required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option value="">Select a client</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.name}</option>)}</select></label>
        <label className="mt-5 flex items-start gap-3 text-sm text-black/70"><input name="includeDocuments" type="checkbox" className="mt-1 size-4 accent-[#602329]" />Include permitted client documents</label>
        <Button type="submit" className="mt-5 w-full">Create export</Button>
        {url && <Button type="button" onClick={() => void download()} variant="outline" className="mt-3 w-full">Download export</Button>}
        {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
      </form>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

type Secret = { _id: string; label: string; type: string; expiresAt?: string };
const pageSize = 10;

export default function SecretManager({ clientId, projectId }: { clientId: string; projectId?: string }) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [revealed, setRevealed] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Secret | null>(null);
  const [revealTarget, setRevealTarget] = useState<Secret | null>(null);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealError, setRevealError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/secrets?${new URLSearchParams({ ...(projectId ? { projectId } : {}), page: String(page), limit: String(pageSize) })}`).then(async (response) => {
      const result = await response.json() as { secrets?: Secret[]; pagination?: { total: number }; error?: string };
      if (response.ok) { setSecrets(result.secrets ?? []); setTotal(result.pagination?.total ?? 0); }
      else setError(result.error ?? "Unable to load secrets.");
    }).catch(() => setError("Unable to load secrets."));
  }, [clientId, projectId, page]);

  async function createSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ label: form.get("label"), type: form.get("type"), value: form.get("value"), expiresAt: form.get("expiresAt") || undefined, projectId }),
    });
    const result = await response.json() as { secret?: Secret; error?: string };
    if (!response.ok || !result.secret) setError(result.error ?? "Unable to save secret.");
    else {
      setSecrets((current) => [result.secret!, ...current]);
      event.currentTarget.reset();
      setError("");
    }

  }

  async function remove(secretId: string) {
    if (!window.confirm("Delete this secret permanently?")) return;
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets/${secretId}`, { method: "DELETE", headers: { "x-confirm-delete": secretId, ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) } });
    if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error ?? "Unable to delete secret."); return; }
    setSecrets((current) => current.filter((secret) => secret._id !== secretId));
  }

  const load = () => fetch(`/api/admin/clients/${clientId}/secrets?${new URLSearchParams({ ...(projectId ? { projectId } : {}), page: String(page), limit: String(pageSize) })}`).then(async (response) => {
    const result = await response.json() as { secrets?: Secret[]; pagination?: { total: number }; error?: string };
    if (response.ok) { setSecrets(result.secrets ?? []); setTotal(result.pagination?.total ?? 0); }
    else setError(result.error ?? "Unable to load secrets.");
  }).catch(() => setError("Unable to load secrets."));

  async function reveal(secretId: string, password: string) {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets/${secretId}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ password }),
    });
    const result = await response.json() as { value?: string; error?: string };
    if (!response.ok) setRevealError(result.error ?? "Unable to reveal secret.");
    else {
      setRevealed(result.value ?? "");
      setRevealError("");
      setError("");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-semibold">Encrypted secrets</h2><p className="mt-1 text-sm text-black/50">Values stay masked until re-authentication.</p></div>
        <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-semibold">{secrets.length}</span>
      </div>
      <div className="mt-4 divide-y divide-black/10">
        {secrets.length === 0 && <p className="py-4 text-sm text-black/50">No secrets stored.</p>}
        {secrets.map((secret) => <div key={secret._id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{secret.label}</p><p className="mt-1 text-xs capitalize text-black/50">{secret.type.replaceAll("-", " ")}{secret.expiresAt ? ` · expires ${new Date(secret.expiresAt).toLocaleDateString()}` : ""}</p></div><div className="flex gap-2"><Button type="button" onClick={() => { setRevealTarget(secret); setRevealError(""); setRevealed(""); }} variant="outline" size="sm">Reveal</Button><Button type="button" onClick={() => setEditing(secret)} variant="outline" size="sm">Edit</Button><DeleteConfirmationDialog label={`Delete ${secret.label}`} description="Archive this encrypted secret from active records." onConfirm={() => remove(secret._id)} /></div></div>)}
      </div>
      {total > pageSize && <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm"><span>Page {page}</span><div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
      <div className="mt-5 border-t border-black/10 pt-5"><SecretCreateDialog onSubmit={createSecret} /></div>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
      {editing && <SecretEditDialog secret={editing} clientId={clientId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
      {revealTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reveal-secret-title"><form onSubmit={(event) => { event.preventDefault(); void reveal(revealTarget._id, revealPassword); }} className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 id="reveal-secret-title" className="text-xl font-semibold">{revealed ? "Revealed secret" : "Re-authenticate to reveal"}</h2>{revealed ? <><pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-amber-50 p-4 text-sm">{revealed}</pre><Button type="button" className="mt-3" onClick={() => void navigator.clipboard.writeText(revealed)}>Copy value</Button></> : <><p className="mt-2 text-sm text-black/60">Enter your admin password to reveal this value.</p><input type="password" autoFocus required value={revealPassword} onChange={(event) => setRevealPassword(event.target.value)} className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3" />{revealError && <p role="alert" className="mt-3 text-sm text-[#602329]">{revealError}</p>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRevealTarget(null)}>Cancel</Button><Button type="submit">Reveal secret</Button></div></>}</form></div>}
    </section>
  );
}

function SecretCreateDialog({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [open, setOpen] = useState(false);
  return <><Button type="button" onClick={() => setOpen(true)}>Add secret</Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-secret-title"><form onSubmit={(event) => { onSubmit(event); setOpen(false); }} className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 id="add-secret-title" className="text-xl font-semibold">Add secret</h2><label className="mt-4 block text-sm font-medium">Label<input name="label" required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label><label className="mt-3 block text-sm font-medium">Type<Select name="type" defaultValue="other"><option value="username-password">Username/password</option><option value="api-key">API key</option><option value="token">Token</option><option value="connection-string">Connection string</option><option value="environment-file">Environment file</option><option value="certificate">Certificate/private key</option><option value="recovery-codes">Recovery codes</option><option value="other">Other</option></Select></label><label className="mt-3 block text-sm font-medium">Secret value<textarea name="value" required rows={4} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label><label className="mt-3 block text-sm font-medium">Expires at<input name="expiresAt" type="date" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Encrypt and save</Button></div></form></div>}</>;
}

function SecretEditDialog({ secret, clientId, onClose, onSaved }: { secret: Secret; clientId: string; onClose: () => void; onSaved: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets/${secret._id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) }, body: JSON.stringify(data) });
    if (response.ok) onSaved();
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 className="text-xl font-semibold">Edit secret</h2><input name="label" required defaultValue={secret.label} className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3" /><select name="type" defaultValue={secret.type} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"><option value="api-key">API key</option><option value="token">Token</option><option value="other">Other</option></select><textarea name="value" placeholder="Leave blank to keep the current value" className="mt-3 w-full rounded-xl border border-black/15 p-3" /><input name="expiresAt" type="date" defaultValue={secret.expiresAt?.slice(0, 10)} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3" /><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save changes</Button></div></form></div>;
}

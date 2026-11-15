"use client";

import { FormEvent, useEffect, useState } from "react";

type Secret = { _id: string; label: string; type: string; expiresAt?: string };

export default function SecretManager({ clientId }: { clientId: string }) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [revealed, setRevealed] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/secrets`).then(async (response) => {
      const result = await response.json() as { secrets?: Secret[]; error?: string };
      if (response.ok) setSecrets(result.secrets ?? []);
      else setError(result.error ?? "Unable to load secrets.");
    }).catch(() => setError("Unable to load secrets."));
  }, [clientId]);

  async function createSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ label: form.get("label"), type: form.get("type"), value: form.get("value"), expiresAt: form.get("expiresAt") || undefined }),
    });
    const result = await response.json() as { secret?: Secret; error?: string };
    if (!response.ok || !result.secret) setError(result.error ?? "Unable to save secret.");
    else {
      setSecrets((current) => [result.secret!, ...current]);
      event.currentTarget.reset();
      setError("");
    }
  }

  async function reveal(secretId: string) {
    const password = window.prompt("Re-enter your admin password to reveal this secret.");
    if (!password) return;
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/secrets/${secretId}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ password }),
    });
    const result = await response.json() as { value?: string; error?: string };
    if (!response.ok) setError(result.error ?? "Unable to reveal secret.");
    else {
      setRevealed(result.value ?? "");
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
        {secrets.map((secret) => <div key={secret._id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{secret.label}</p><p className="mt-1 text-xs capitalize text-black/50">{secret.type.replaceAll("-", " ")}{secret.expiresAt ? ` · expires ${new Date(secret.expiresAt).toLocaleDateString()}` : ""}</p></div><button type="button" onClick={() => void reveal(secret._id)} className="min-h-10 rounded-lg border border-black/10 px-3 text-xs font-semibold hover:border-[#602329] hover:text-[#602329]">Reveal</button></div>)}
      </div>
      {revealed && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-950">Revealed value</p><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-amber-950">{revealed}</pre><button type="button" onClick={() => setRevealed("")} className="mt-2 text-xs font-semibold text-amber-950 underline">Hide value</button></div>}
      <form onSubmit={createSecret} className="mt-5 grid gap-3 border-t border-black/10 pt-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Label<input name="label" required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium">Type<select name="type" defaultValue="other" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option value="username-password">Username/password</option><option value="api-key">API key</option><option value="token">Token</option><option value="connection-string">Connection string</option><option value="environment-file">Environment file</option><option value="certificate">Certificate/private key</option><option value="recovery-codes">Recovery codes</option><option value="other">Other</option></select></label>
        <label className="text-sm font-medium sm:col-span-2">Secret value<textarea name="value" required rows={4} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label>
        <label className="text-sm font-medium">Expires at<input name="expiresAt" type="date" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <button type="submit" className="self-end min-h-11 rounded-xl bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black">Encrypt and save</button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
    </section>
  );
}

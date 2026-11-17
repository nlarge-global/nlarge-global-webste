"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useState } from "react";
import { FiCheck, FiKey, FiMail, FiSave, FiSettings } from "react-icons/fi";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import { BCRYPT_PASSWORD_MAX_BYTES } from "@/features/admin/auth/bcrypt-password";

type Settings = { displayName: string; timezone: string; dateFormat: string; emailSignature: string; defaultReplyTemplate: string };
type SecretType = "ADMIN_SESSION_SECRET" | "UNSUBSCRIBE_TOKEN_SECRET" | "MASTER_ENCRYPTION_KEY";

function isSecretType(value: string): value is SecretType {
  return value === "ADMIN_SESSION_SECRET"
    || value === "UNSUBSCRIBE_TOKEN_SECRET"
    || value === "MASTER_ENCRYPTION_KEY";
}

const secretDescriptions: Record<SecretType, string> = {
  ADMIN_SESSION_SECRET: "Replacing this value invalidates all existing admin sessions; you will need to sign in again.",
  UNSUBSCRIBE_TOKEN_SECRET: "Replacing this value invalidates previously issued unsubscribe links.",
  MASTER_ENCRYPTION_KEY: "Do not replace the current key directly. Existing client secrets require a key re-wrapping migration first; this app does not perform that migration.",
};

const dateFormatOptions = [
  { value: "dd MMM yyyy", label: "12 Nov 2026", description: "Day, short month, year" },
  { value: "dd MMMM yyyy", label: "12 November 2026", description: "Day, full month, year" },
  { value: "dd/MM/yyyy", label: "12/11/2026", description: "Day / month / year" },
  { value: "MM/dd/yyyy", label: "11/12/2026", description: "Month / day / year" },
  { value: "yyyy-MM-dd", label: "2026-11-12", description: "International numeric format" },
  { value: "EEE, dd MMM yyyy", label: "Thu, 12 Nov 2026", description: "Day name, date" },
] as const;

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hash, setHash] = useState("");
  const [secretType, setSecretType] = useState<SecretType>("ADMIN_SESSION_SECRET");
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  const csrf = () => document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json", ...(csrf() ? { "x-csrf-token": decodeURIComponent(csrf()!) } : {}) }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to save settings.");
    else { setError(""); setMessage("Settings saved."); setDirty(false); }
  }

  async function generateHash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", ...(csrf() ? { "x-csrf-token": decodeURIComponent(csrf()!) } : {}) }, body: JSON.stringify({ kind: "password-hash", password }) });
    const result = await response.json() as { error?: string; hash?: string };
    if (!response.ok) setError(result.error ?? "Unable to generate hash.");
    else { setHash(result.hash ?? ""); setError(""); }
  }

  async function generateSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecret("");
    setCopied(false);
    try {
      const response = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json", ...(csrf() ? { "x-csrf-token": decodeURIComponent(csrf()!) } : {}) }, body: JSON.stringify({ kind: "secret", secretType }) });
      const result = await response.json() as { error?: string; secret?: string };
      if (!response.ok) setError(result.error ?? "Unable to generate secret.");
      else { setSecret(result.secret ?? ""); setError(""); }
    } catch (error) {
      setError(getDisplayErrorMessage(error, "Unable to reach the server. Check your connection and try again."));
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setError("");
    } catch (error) {
      setError(getDisplayErrorMessage(error, "Could not copy the secret. Select it and copy it manually."));
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} onChange={() => { setDirty(true); setMessage(""); }} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <section className="border-b border-black/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f3f0] text-[#602329]"><FiSettings aria-hidden="true" /></span>
            <div><h2 className="font-semibold">Workspace preferences</h2><p className="mt-1 text-sm leading-6 text-black/55">Set how the private workspace identifies you and displays dates.</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Display name<input name="displayName" defaultValue={initial.displayName} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/10" /></label>
            <label className="text-sm font-medium">Timezone<input name="timezone" defaultValue={initial.timezone} placeholder="Asia/Kolkata" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/10" /></label>
            <label className="text-sm font-medium">
              Date format
              <Select name="dateFormat" defaultValue={initial.dateFormat}>
                {!dateFormatOptions.some((option) => option.value === initial.dateFormat) && <option value={initial.dateFormat}>{initial.dateFormat} (saved custom format)</option>}
                {dateFormatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <span className="mt-2 block text-xs font-normal leading-5 text-black/50">Choose how dates appear. Example: {dateFormatOptions.find((option) => option.value === initial.dateFormat)?.label ?? initial.dateFormat}.</span>
            </label>
          </div>
        </section>
        <section className="border-b border-black/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f3f0] text-[#602329]"><FiMail aria-hidden="true" /></span>
            <div><h2 className="font-semibold">Communication defaults</h2><p className="mt-1 text-sm leading-6 text-black/55">These values make dashboard replies consistent. Review them before sending.</p></div>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Email signature<textarea name="emailSignature" rows={3} defaultValue={initial.emailSignature} className="mt-2 w-full rounded-xl border border-black/15 p-3 outline-none focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/10" /></label>
            <label className="block text-sm font-medium">Default reply template<textarea name="defaultReplyTemplate" rows={5} defaultValue={initial.defaultReplyTemplate} className="mt-2 w-full rounded-xl border border-black/15 p-3 outline-none focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/10" /></label>
          </div>
        </section>
        <div className="flex flex-col gap-3 bg-[#fbfaf8] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {message ? <p role="status" className="inline-flex items-center gap-2 text-sm text-emerald-700"><FiCheck aria-hidden="true" />{message}</p> : <span />}
          <Button type="submit" disabled={!dirty}><FiSave aria-hidden="true" />Save preferences</Button>
        </div>
      </form>
      <form onSubmit={generateHash} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800"><FiKey aria-hidden="true" /></span>
          <div><h2 className="font-semibold text-amber-950">Password security</h2><p className="mt-1 text-sm leading-6 text-amber-950/70">Generate a bcrypt hash for deployment. Passwords are limited to 72 UTF-8 bytes; the password and generated hash are never saved by this page.</p></div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input name="password" type="password" minLength={12} maxLength={BCRYPT_PASSWORD_MAX_BYTES} required placeholder="New password (12+ characters)" className="min-h-11 min-w-0 flex-1 rounded-xl border border-amber-300 bg-white px-3 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10" /><Button type="submit" variant="outline" className="border-amber-300 text-amber-950 hover:border-amber-700"><FiKey aria-hidden="true" />Generate hash</Button></div>
        {hash && <output className="mt-4 block break-all rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-950">{hash}</output>}
      </form>
      <form onSubmit={generateSecret} className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f3f0] text-[#602329]"><FiKey aria-hidden="true" /></span>
          <div><h2 className="font-semibold">Deployment secrets</h2><p className="mt-1 text-sm leading-6 text-black/55">Generate a new 256-bit secret for manual deployment. This does not change your environment or rotate a key.</p></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="text-sm font-medium">
            Secret to generate
            <Select value={secretType} onChange={(event) => {
              const value = event.target.value;
              if (!isSecretType(value)) return;
              setSecretType(value);
              setSecret("");
              setCopied(false);
            }}>
              <option value="ADMIN_SESSION_SECRET">Admin session secret</option>
              <option value="UNSUBSCRIBE_TOKEN_SECRET">Unsubscribe token secret</option>
              <option value="MASTER_ENCRYPTION_KEY">Master encryption key</option>
            </Select>
          </label>
          <div className="flex items-end"><Button type="submit" variant="outline"><FiKey aria-hidden="true" />Generate secret</Button></div>
        </div>
        <p className="mt-3 text-sm leading-6 text-black/60">{secretDescriptions[secretType]}</p>
        {secret && (
          <div className="mt-4">
            <label htmlFor="generated-secret" className="text-sm font-medium">Generated value — copy it to your deployment secret store</label>
            <textarea id="generated-secret" readOnly rows={2} value={secret} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full resize-y rounded-xl border border-black/15 bg-[#fbfaf8] p-3 font-mono text-sm leading-6 outline-none focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/10" />
            <div className="mt-2 flex items-center gap-3">
              <Button type="button" variant="outline" onClick={copySecret}>{copied ? "Copied" : "Copy secret"}</Button>
              <p role="status" aria-live="polite" className="text-sm text-black/55">{copied ? "Copied to clipboard." : "This value is shown only here; save it before leaving."}</p>
            </div>
          </div>
        )}
      </form>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
    </div>
  );
}

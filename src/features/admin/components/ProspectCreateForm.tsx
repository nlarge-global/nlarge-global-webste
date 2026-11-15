"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";

function csrfToken() {
  return document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
}

export default function ProspectCreateForm({ onCreated }: { onCreated: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const token = csrfToken();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": decodeURIComponent(token) } : {}) },
        body: JSON.stringify(data),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) {
        setError(result.error ?? "Unable to add this prospect.");
        return;
      }
      onCreated();
      router.push(`/admin/prospects/${result.id}`);
      router.refresh();
    } catch {
      setError("Unable to add this prospect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Business or person
          <input name="name" maxLength={150} autoComplete="organization" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
        <label className="block text-sm font-medium">Website or profile URL
          <input name="url" type="url" maxLength={2048} inputMode="url" placeholder="https://" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Found via
          <Select name="source" defaultValue="other">
            <option value="other">Other</option>
            <option value="google-maps">Google Maps</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="call">Call</option>
          </Select>
        </label>
        <label className="block text-sm font-medium">Follow-up date
          <input name="followUpAt" type="date" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
      </div>
      <label className="block text-sm font-medium">Next action
        <input name="nextAction" maxLength={500} placeholder="For example, review their website" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
      </label>
      <label className="block text-sm font-medium">Notes
        <textarea name="notes" maxLength={5000} rows={4} className="mt-2 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
      </label>
      <p className="text-xs text-black/55">A name or a valid URL is required. New prospects start in “To review.”</p>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save prospect"}</Button>
    </form>
  );
}

"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";
import type { ProspectSource, ProspectStatus } from "@/features/admin/models/prospect";

type Prospect = {
  id: string;
  name: string;
  url: string;
  source: ProspectSource;
  status: ProspectStatus;
  notes: string;
  nextAction: string;
  followUpAt: string;
};

const sourceLabels: Record<ProspectSource, string> = {
  "google-maps": "Google Maps",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  website: "Website",
  referral: "Referral",
  call: "Call",
  other: "Other",
};
const statusLabels: Record<ProspectStatus, string> = {
  "to-review": "To review",
  "ready-to-contact": "Ready to contact",
  contacted: "Contacted",
  responded: "Responded",
  converted: "Converted",
  "not-a-fit": "Not a fit",
};

function csrfToken() {
  return document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
}

export default function ProspectEditor({ prospect }: { prospect: Prospect }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const token = csrfToken();
    setPending(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/admin/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": decodeURIComponent(token) } : {}) },
        body: JSON.stringify(data),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to update this prospect.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (error) {
      setError(getDisplayErrorMessage(error, "Unable to update this prospect. Check your connection and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="prospect-details-heading" className="rounded-2xl border border-[#e8e0da] bg-white p-5 sm:p-6">
      <h2 id="prospect-details-heading" className="text-lg font-semibold">Prospect details</h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium">Business or person
          <input name="name" defaultValue={prospect.name} maxLength={150} className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
        <label className="block text-sm font-medium">Website or profile URL
          <input name="url" type="url" defaultValue={prospect.url} maxLength={2048} inputMode="url" placeholder="https://" className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Found via
            <Select name="source" defaultValue={prospect.source}>
              {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
          <label className="block text-sm font-medium">Status
            <Select name="status" defaultValue={prospect.status}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
        </div>
        <label className="block text-sm font-medium">Next action
          <input name="nextAction" defaultValue={prospect.nextAction} maxLength={500} placeholder="For example, send an introduction" className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
        <label className="block text-sm font-medium">Follow-up date
          <input name="followUpAt" type="date" defaultValue={prospect.followUpAt} className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
        <label className="block text-sm font-medium">Notes
          <textarea name="notes" defaultValue={prospect.notes} maxLength={5000} rows={6} className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]" />
        </label>
        {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
        {saved && <p role="status" className="text-sm text-emerald-800">Changes saved.</p>}
        <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save changes"}</Button>
      </form>
    </section>
  );
}

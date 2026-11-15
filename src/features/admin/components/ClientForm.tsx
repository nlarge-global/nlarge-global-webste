"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ClientFormValues = { name: string; email?: string; company?: string; phone?: string; notes?: string; tags: string[] };

export default function ClientForm({ client }: { client?: ClientFormValues & { _id: string } }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const values = {
      name: form.get("name"),
      email: form.get("email"),
      company: form.get("company"),
      phone: form.get("phone"),
      notes: form.get("notes"),
      tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    const response = await fetch(client ? `/api/admin/clients/${client._id}` : "/api/admin/clients", {
      method: client ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify(values),
    });
    const result = await response.json() as { error?: string; client?: { _id: string } };
    if (!response.ok) setError(result.error ?? "Unable to save client.");
    else router.push(client ? `/admin/clients/${client._id}` : `/admin/clients/${result.client?._id}`);
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-medium">Name<input name="name" required defaultValue={client?.name} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
      <label className="text-sm font-medium">Email<input name="email" type="email" defaultValue={client?.email} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
      <label className="text-sm font-medium">Company<input name="company" defaultValue={client?.company} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
      <label className="text-sm font-medium">Phone<input name="phone" defaultValue={client?.phone} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
      <label className="text-sm font-medium sm:col-span-2">Tags <span className="font-normal text-black/45">(comma-separated)</span><input name="tags" defaultValue={client?.tags.join(", ")} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
      <label className="text-sm font-medium sm:col-span-2">Private notes<textarea name="notes" rows={5} defaultValue={client?.notes} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label>
      {error && <p role="alert" className="text-sm text-[#602329] sm:col-span-2">{error}</p>}
      <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-[#602329] px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 sm:col-span-2">{pending ? "Saving..." : client ? "Save changes" : "Create client"}</button>
    </form>
  );
}

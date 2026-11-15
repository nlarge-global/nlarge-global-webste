"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";

export default function InquiryCreateForm({ onCreated }: { onCreated: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement).entries());
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) {
        setError(result.error ?? "Unable to create inquiry.");
        return;
      }
      onCreated();
      router.push(`/admin/inquiries/${result.id}`);
      router.refresh();
    } catch {
      setError("Unable to create inquiry. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Name
        <input name="name" required minLength={2} maxLength={50} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
      </label>
      <label className="block text-sm font-medium">Email
        <input name="email" type="email" required maxLength={254} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Inquiry type
          <Select name="queryType" defaultValue="general">
            <option value="general">General</option>
            <option value="support">Support</option>
            <option value="business">Business</option>
            <option value="careers">Careers</option>
          </Select>
        </label>
        <label className="block text-sm font-medium">Source
          <Select name="source" defaultValue="other">
            <option value="other">Other</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="linkedin">LinkedIn</option>
            <option value="call">Call</option>
            <option value="friend">Friend</option>
            <option value="personal">Personal</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </Select>
        </label>
      </div>
      <label className="block text-sm font-medium">Subject
        <input name="subject" required minLength={5} maxLength={100} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
      </label>
      <label className="block text-sm font-medium">Message
        <textarea name="message" required maxLength={1000} rows={5} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
      </label>
      <p className="text-xs leading-5 text-black/55">This record will be marked as manually entered. Public contact-form consent was not collected.</p>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating…" : "Create inquiry"}</Button>
    </form>
  );
}

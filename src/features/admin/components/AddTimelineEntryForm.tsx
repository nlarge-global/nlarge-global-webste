"use client";

import { FormEvent, useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";
import type { TimelineEntry } from "./ConversationTimeline";

function localDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function AddTimelineEntryForm({
  inquiryId,
  onSaved,
}: {
  inquiryId: string;
  onSaved: (entry: TimelineEntry) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({
          channel: form.get("channel"),
          direction: form.get("direction"),
          content: form.get("content"),
          occurredAt: form.get("occurredAt"),
        }),
      });
      const result = await response.json() as { entry?: TimelineEntry; error?: string };
      if (!response.ok || !result.entry) {
        setError(result.error ?? "Unable to save entry.");
        return;
      }
      formElement.reset();
      onSaved(result.entry);
    } catch {
      setError("Unable to save entry. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Channel
          <Select name="channel" defaultValue="internal-note">
            <option value="internal-note">Internal note</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="meeting">Meeting</option>
          </Select>
        </label>
        <label className="block text-sm font-medium">Direction
          <Select name="direction" defaultValue="internal">
            <option value="internal">Internal</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </Select>
        </label>
      </div>
      <label className="block text-sm font-medium">Occurred at
        <input name="occurredAt" type="datetime-local" defaultValue={localDateTime()} required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
      </label>
      <label className="block text-sm font-medium">Entry
        <textarea name="content" required maxLength={5000} rows={6} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
      </label>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save entry"}</Button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import { FiMessageSquare } from "react-icons/fi";

type TimelineEntry = {
  _id: string;
  channel: string;
  direction: string;
  content: string;
  occurredAt: string;
};

export default function ConversationTimeline({ inquiryId, initialEntries }: { inquiryId: string; initialEntries: TimelineEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
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
    if (!response.ok || !result.entry) setError(result.error ?? "Unable to save entry.");
    else {
      setEntries((current) => [result.entry!, ...current].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)));
      event.currentTarget.reset();
    }
    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      <section className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-center gap-3">
          <FiMessageSquare aria-hidden="true" className="size-5 text-[#602329]" />
          <div>
            <h2 className="font-semibold">Conversation timeline</h2>
            <p className="text-sm text-black/50">Entries are sorted by when they occurred.</p>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="mt-8 rounded-xl bg-[#f5f3f0] p-5 text-sm text-black/55">No conversation entries yet.</p>
        ) : (
          <ol className="mt-6 space-y-4">
            {entries.map((entry) => (
              <li key={entry._id} className="border-l-2 border-[#602329]/25 pl-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/50">
                  <span className="font-semibold capitalize text-black/75">{entry.channel.replace("-", " ")}</span>
                  <span>·</span>
                  <span className="capitalize">{entry.direction}</span>
                  <span>·</span>
                  <time dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString()}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/75">{entry.content}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <form onSubmit={addEntry} className="h-fit rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Add entry</h2>
        <label className="mt-5 block text-sm font-medium">Channel
          <Select name="channel" defaultValue="internal-note">
            <option value="internal-note">Internal note</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="meeting">Meeting</option>
          </Select>
        </label>
        <label className="mt-4 block text-sm font-medium">Direction
          <Select name="direction" defaultValue="internal">
            <option value="internal">Internal</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </Select>
        </label>
        <label className="mt-4 block text-sm font-medium">Occurred at
          <input name="occurredAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">Entry
          <textarea name="content" required maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
        <Button type="submit" disabled={pending} className="mt-5 w-full">
          {pending ? "Saving..." : "Save entry"}
        </Button>
      </form>
    </div>
  );
}

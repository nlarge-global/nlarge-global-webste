"use client";

import { getDisplayErrorMessage } from "@/lib/error-message";
import { useId, useState, type FormEvent } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";

export type TimelineEntryValues = {
  channel: "email" | "whatsapp" | "phone" | "meeting" | "internal-note";
  direction: "inbound" | "outbound" | "internal";
  content: string;
  occurredAt: string;
};

export type EditableTimelineEntry = TimelineEntryValues & {
  _id: string;
  occurredAt: string;
};

function localDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function TimelineEntryForm({
  entry,
  initialValues,
  onSave,
}: {
  entry?: EditableTimelineEntry;
  initialValues?: Partial<TimelineEntryValues>;
  onSave: (values: TimelineEntryValues) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const id = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await onSave({
        channel: String(form.get("channel")) as TimelineEntryValues["channel"],
        direction: String(form.get("direction")) as TimelineEntryValues["direction"],
        content: String(form.get("content") ?? ""),
        occurredAt: String(form.get("occurredAt") ?? ""),
      });
    } catch (reason) {
      setError(getDisplayErrorMessage(reason, "Unable to save entry. Check your connection and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-channel`} className="block text-sm font-medium">
          Channel
          <Select id={`${id}-channel`} name="channel" defaultValue={initialValues?.channel ?? entry?.channel ?? "internal-note"}>
            <option value="internal-note">Internal note</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="meeting">Meeting</option>
          </Select>
        </label>
        <label htmlFor={`${id}-direction`} className="block text-sm font-medium">
          Direction
          <Select id={`${id}-direction`} name="direction" defaultValue={initialValues?.direction ?? entry?.direction ?? "internal"}>
            <option value="internal">Internal</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </Select>
        </label>
      </div>
      <label htmlFor={`${id}-occurred-at`} className="block text-sm font-medium">
        Occurred at
        <input
          id={`${id}-occurred-at`}
          name="occurredAt"
          type="datetime-local"
          defaultValue={initialValues?.occurredAt ?? (entry ? localDateTime(entry.occurredAt) : localDateTime())}
          required
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label htmlFor={`${id}-content`} className="block text-sm font-medium">
        Entry
        <textarea
          id={`${id}-content`}
          name="content"
          defaultValue={initialValues?.content ?? entry?.content}
          required
          maxLength={5000}
          rows={6}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : entry ? "Save changes" : "Save entry"}
      </Button>
    </form>
  );
}

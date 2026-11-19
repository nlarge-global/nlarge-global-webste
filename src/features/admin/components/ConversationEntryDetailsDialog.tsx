"use client";

import { FiX } from "react-icons/fi";
import { Button } from "./ui/Button";
import type { TimelineEntryValues } from "./TimelineEntryForm";
import { useDialogEscape } from "./useDialogEscape";

export type ConversationEntryDetails = {
  _id: string;
  channel: TimelineEntryValues["channel"];
  direction: TimelineEntryValues["direction"];
  content: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export default function ConversationEntryDetailsDialog({
  entry,
  loading,
  error,
  onClose,
}: {
  entry: ConversationEntryDetails | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  const dialogRef = useDialogEscape(true, onClose);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-entry-details-title"
      aria-busy={loading}
    >
      <section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="conversation-entry-details-title" className="text-xl font-semibold">
              Entry details
            </h2>
            {entry && (
              <p className="mt-1 text-sm capitalize text-black/55">
                {entry.channel.replaceAll("-", " ")} · {entry.direction}
              </p>
            )}
          </div>
          <Button type="button" variant="outline" size="icon" aria-label="Close details" title="Close details" onClick={onClose}>
            <FiX aria-hidden="true" />
          </Button>
        </header>
        {loading ? (
          <div role="status" aria-busy="true" className="mt-5 space-y-3">
            <span className="sr-only">Loading entry details</span>
            <div className="h-4 w-2/3 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-24 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          </div>
        ) : entry ? (
          <div className="mt-5 space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <p><span className="font-semibold">Occurred:</span> {new Date(entry.occurredAt).toLocaleString()}</p>
              <p><span className="font-semibold">Created:</span> {new Date(entry.createdAt).toLocaleString()}</p>
              <p className="sm:col-span-2"><span className="font-semibold">Updated:</span> {new Date(entry.updatedAt).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Content</h3>
              <p className="mt-2 whitespace-pre-wrap break-words leading-6 text-black/70">{entry.content}</p>
            </div>
          </div>
        ) : (
          <p role="alert" className="mt-5 text-sm text-[#602329]">{error || "Unable to load entry details."}</p>
        )}
      </section>
    </div>
  );
}

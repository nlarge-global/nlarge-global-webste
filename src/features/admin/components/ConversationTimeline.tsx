"use client";

import { getDisplayErrorMessage } from "@/lib/error-message";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FiChevronDown, FiMail, FiMessageSquare, FiPlus, FiSearch } from "react-icons/fi";
import { IoCloseSharp } from "react-icons/io5";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import { useDialogEscape } from "./useDialogEscape";
import RecordActionsMenu from "./RecordActionsMenu";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";
import {
  deleteAdminRecord,
  restoreAdminRecord,
  type DeleteMode,
} from "./admin-delete";
import type { TimelineEntryValues } from "./TimelineEntryForm";
import type { ConversationEntryDetails } from "./ConversationEntryDetailsDialog";

export type TimelineEntry = {
  _id: string;
  channel: string;
  direction: string;
  content: string;
  occurredAt: string;
  deletedAt?: string;
};

const PAGE_SIZE = 30;

const EntryForm = dynamic(() => import("./TimelineEntryForm"), {
  ssr: false,
  loading: () => <FormSkeleton />,
});
const EntryDetailsDialog = dynamic(() => import("./ConversationEntryDetailsDialog"), {
  ssr: false,
});
const ReplyComposer = dynamic(() => import("./ReplyComposer"), {
  ssr: false,
  loading: () => <FormSkeleton />,
});

function FormSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading form" className="space-y-4">
      <div className="h-11 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
      <div className="h-11 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
      <div className="h-32 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
      <div className="h-11 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
    </div>
  );
}

function csrfToken() {
  const cookie = document.cookie.split("; ").find((item) => item.startsWith("nlarge_admin_csrf="));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : undefined;
}

function sortEntries(entries: TimelineEntry[]) {
  return [...entries].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b._id.localeCompare(a._id));
}

export default function ConversationTimeline({
  inquiryId,
  initialEntries,
  initialHasMore,
}: {
  inquiryId: string;
  initialEntries: TimelineEntry[];
  initialHasMore: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [channel, setChannel] = useState("");
  const [direction, setDirection] = useState("");
  const [archive, setArchive] = useState("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"entry" | "edit" | "reply" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState<ConversationEntryDetails | null>(null);
  const [entryDraft, setEntryDraft] = useState<TimelineEntryValues | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [detailsEntryId, setDetailsEntryId] = useState<string | null>(null);
  const [detailsEntry, setDetailsEntry] = useState<ConversationEntryDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [deleteEntry, setDeleteEntry] = useState<TimelineEntry | null>(null);
  const firstFetch = useRef(true);
  const dialogRef = useDialogEscape(Boolean(dialog), closeEntryDialog);

  function closeEntryDialog() {
    setDialog(null);
    setEditingEntry(null);
    setEntryDraft(null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (firstFetch.current) {
      firstFetch.current = false;
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({
      ...(channel ? { channel } : {}),
      ...(direction ? { direction } : {}),
      archive,
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    });
    setLoading(true);
    setEntries([]);
    setHasMore(false);
    setError("");
    fetch(`/api/admin/inquiries/${inquiryId}/conversation?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json() as { entries?: TimelineEntry[]; hasMore?: boolean; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load timeline.");
        setEntries(result.entries ?? []);
        setHasMore(result.hasMore ?? false);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(getDisplayErrorMessage(cause, "Unable to load timeline."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [archive, channel, debouncedSearch, direction, inquiryId, refreshKey]);

  async function loadOlder() {
    const oldest = entries.at(-1);
    if (!oldest) return;
    const params = new URLSearchParams({
      beforeAt: oldest.occurredAt,
      beforeId: oldest._id,
      ...(channel ? { channel } : {}),
      ...(direction ? { direction } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      archive,
    });
    setLoadingOlder(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/conversation?${params}`);
      const result = await response.json() as { entries?: TimelineEntry[]; hasMore?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load older entries.");
      setEntries((current) => [...current, ...(result.entries ?? [])]);
      setHasMore(result.hasMore ?? false);
    } catch (cause) {
      setError(getDisplayErrorMessage(cause, "Unable to load older entries."));
    } finally {
      setLoadingOlder(false);
    }
  }

  function matchesFilters(entry: TimelineEntry) {
    return (!channel || entry.channel === channel)
      && (!direction || entry.direction === direction)
      && (!debouncedSearch || entry.content.toLocaleLowerCase().includes(debouncedSearch.toLocaleLowerCase()));
  }

  async function saveEntry(values: TimelineEntryValues) {
    const editing = editingEntry;
    setEntryDraft(values);
    setDialog(null);
    const occurredAt = new Date(values.occurredAt).toISOString();
    const optimistic: TimelineEntry = {
      _id: editing?._id ?? `optimistic-${crypto.randomUUID()}`,
      ...values,
      occurredAt,
    };
    const previous = entries;
    if (editing) {
      setEntries((current) => sortEntries(current
        .map((entry) => entry._id === editing._id ? optimistic : entry)
        .filter(matchesFilters)));
    } else if (matchesFilters(optimistic)) {
      setEntries((current) => sortEntries([optimistic, ...current]));
    }

    try {
      const token = csrfToken();
      const response = await fetch(
        editing
          ? `/api/admin/inquiries/${inquiryId}/conversation/${editing._id}`
          : `/api/admin/inquiries/${inquiryId}/conversation`,
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-csrf-token": token } : {}),
          },
          body: JSON.stringify(values),
        },
      );
      const result = await response.json() as { entry?: TimelineEntry; error?: string };
      if (!response.ok || !result.entry) throw new Error(result.error ?? "Unable to save entry.");
      const saved = result.entry;
      setEntries((current) => sortEntries(current
        .filter((entry) => entry._id !== optimistic._id)
        .concat(matchesFilters(saved) ? [saved] : [])));
      toast.success(editing ? "Conversation entry updated." : "Conversation entry added.");
      setEditingEntry(null);
      setEntryDraft(null);
    } catch (cause) {
      setEntries(previous);
      const message = getDisplayErrorMessage(cause, "Unable to save entry. Check your connection and try again.");
      showOptimisticRecoveryToast(message, () => {
        setEntryDraft(values);
        setDialog(editing ? "edit" : "entry");
      });
    }
  }

  async function loadEntryDetails(entryId: string) {
    const response = await fetch(`/api/admin/inquiries/${inquiryId}/conversation/${entryId}`);
    const result = await response.json() as { entry?: ConversationEntryDetails; error?: string };
    if (!response.ok || !result.entry) throw new Error(result.error ?? "Unable to load entry details.");
    return result.entry;
  }

  async function showDetails(entryId: string) {
    setDetailsEntryId(entryId);
    setDetailsEntry(null);
    setDetailsError("");
    setDetailsLoading(true);
    try {
      setDetailsEntry(await loadEntryDetails(entryId));
    } catch (cause) {
      const message = getDisplayErrorMessage(cause, "Unable to load entry details.");
      setDetailsError(message);
      toast.error(message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function editEntry(entryId: string) {
    setEditingEntry(null);
    setEntryDraft(null);
    setEditingLoading(true);
    setDialog("edit");
    try {
      setEditingEntry(await loadEntryDetails(entryId));
    } catch (cause) {
      toast.error(getDisplayErrorMessage(cause, "Unable to load entry for editing."));
      setDialog(null);
    } finally {
      setEditingLoading(false);
    }
  }

  async function deleteSelectedEntry(mode: DeleteMode) {
    if (!deleteEntry) return;
    const removed = deleteEntry;
    const previous = entries;
    setEntries((current) => current.filter((entry) => entry._id !== removed._id));
    try {
      await deleteAdminRecord(
        `/api/admin/inquiries/${inquiryId}/conversation/${removed._id}`,
        removed._id,
        mode,
        "Unable to delete entry.",
      );
      toast.success(mode === "permanent" ? "Conversation entry permanently deleted." : "Conversation entry archived.");
    } catch (cause) {
      setEntries(previous);
      const message = getDisplayErrorMessage(cause, "Unable to delete entry.");
      throw new Error(message);
    }
  }

  async function restoreEntry(entry: TimelineEntry) {
    try {
      await restoreAdminRecord(
        `/api/admin/inquiries/${inquiryId}/conversation/${entry._id}`,
        entry._id,
        "Unable to restore conversation entry.",
      );
      setRefreshKey((current) => current + 1);
      toast.success("Conversation entry restored.");
    } catch (cause) {
      toast.error(
        getDisplayErrorMessage(cause, "Unable to restore conversation entry."),
      );
    }
  }

  function savedReply() {
    setDialog(null);
    setRefreshKey((current) => current + 1);
  }

  const hasFilters = Boolean(channel || direction || debouncedSearch || archive !== "active");

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <header className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f3f0] text-[#602329]">
            <FiMessageSquare aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Conversation timeline</h2>
            <p className="text-sm text-black/55">Newest first · {PAGE_SIZE} entries per page</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => { setEntryDraft(null); setDialog("entry"); }}>
            <FiPlus aria-hidden="true" /> Add entry
          </Button>
          <Button type="button" onClick={() => setDialog("reply")}>
            <FiMail aria-hidden="true" /> Reply by email
          </Button>
        </div>
      </header>

      <div className="grid gap-3 border-b border-black/10 bg-[#fbfaf8] p-4 sm:grid-cols-[minmax(12rem,1fr)_10rem_10rem_10rem] sm:px-6">
        <label className="relative block text-sm font-medium">
          <span className="sr-only">Search timeline entries</span>
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/45" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search entry text"
            className="min-h-11 w-full rounded-xl border border-black/15 bg-white pl-9 pr-3 outline-none focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/10"
          />
        </label>
        <label className="text-sm font-medium">
          <span className="sr-only">Filter by channel</span>
          <Select aria-label="Filter by channel" value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="">All channels</option>
            <option value="internal-note">Internal note</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="meeting">Meeting</option>
          </Select>
        </label>
        <label className="text-sm font-medium">
          <span className="sr-only">Filter by direction</span>
          <Select aria-label="Filter by direction" value={direction} onChange={(event) => setDirection(event.target.value)}>
            <option value="">All directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
            <option value="internal">Internal</option>
          </Select>
        </label>
        <label className="text-sm font-medium">
          <span className="sr-only">Filter records</span>
          <Select aria-label="Filter records" value={archive} onChange={(event) => setArchive(event.target.value)}>
            <option value="active">Active entries</option>
            <option value="archived">Archived entries</option>
            <option value="all">All entries</option>
          </Select>
        </label>
      </div>

      {error && <p role="alert" className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{error}</p>}
      {loading ? (
        <div role="status" aria-label="Loading timeline" className="space-y-4 p-5 sm:p-6">
          <span className="sr-only">Loading timeline entries</span>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} aria-hidden="true" className="space-y-3 rounded-xl border border-black/10 p-4">
              <div className="h-4 w-2/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-6 text-sm text-black/55">
          {hasFilters ? "No entries match these filters." : "No conversation entries yet. Add a note or record an interaction."}
        </p>
      ) : (
        <ol aria-live="polite" className="divide-y divide-black/10">
          {entries.map((entry) => (
            <li key={entry._id} className="grid gap-3 p-4 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:gap-5 sm:px-6 sm:py-5">
              <time dateTime={entry.occurredAt} className="pt-0.5 text-xs leading-5 text-black/55">
                {new Date(entry.occurredAt).toLocaleString(undefined, {
                  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </time>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f5f3f0] px-2.5 py-1 text-xs font-semibold capitalize text-[#4c403b]">
                    {entry.channel.replaceAll("-", " ")}
                  </span>
                  <span className="text-xs font-medium capitalize text-black/55">{entry.direction.replaceAll("-", " ")}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-black/75">
                  {entry.content.length > 200 ? `${entry.content.slice(0, 200).trimEnd()}…` : entry.content}
                </p>
                {entry.content.length > 200 && (
                  <button type="button" onClick={() => void showDetails(entry._id)} className="mt-1 text-sm font-medium text-[#602329] underline underline-offset-2 cursor-pointer">
                    Read full entry
                  </button>
                )}
              </div>
              <RecordActionsMenu
                label="conversation entry"
                edit={{ onSelect: () => void editEntry(entry._id) }}
                details={{ onSelect: () => void showDetails(entry._id) }}
                restore={
                  entry.deletedAt
                    ? { onSelect: () => void restoreEntry(entry) }
                    : undefined
                }
                delete={{ onSelect: () => setDeleteEntry(entry) }}
              />
            </li>
          ))}
        </ol>
      )}
      {!loading && hasMore && entries.length > 0 && (
        <div className="border-t border-black/10 p-4 text-center">
          <Button type="button" variant="outline" onClick={() => void loadOlder()} disabled={loadingOlder}>
            <FiChevronDown aria-hidden="true" /> {loadingOlder ? "Loading…" : "Load older entries"}
          </Button>
        </div>
      )}

      {dialog && (
        <div ref={dialogRef} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3" role="dialog" aria-modal="true" aria-labelledby="inquiry-action-title">
          <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl sm:p-6">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="inquiry-action-title" className="text-xl font-semibold">
                  {dialog === "reply" ? "Reply by email" : dialog === "edit" ? "Edit timeline entry" : "Add timeline entry"}
                </h2>
                <p className="mt-1 text-sm text-black/55">
                  {dialog === "reply" ? "Review the saved reply defaults before sending." : "Record a note or an interaction."}
                </p>
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Close dialog" onClick={closeEntryDialog}>
                <IoCloseSharp aria-hidden="true" />
              </Button>
            </header>
            {dialog === "reply"
              ? <ReplyComposer inquiryId={inquiryId} onSent={savedReply} />
              : editingLoading
                ? <FormSkeleton />
                : <EntryForm
                    entry={dialog === "edit" ? editingEntry ?? undefined : undefined}
                    initialValues={entryDraft ?? undefined}
                    onSave={saveEntry}
                  />}
          </section>
        </div>
      )}
      {detailsEntryId && (
        <EntryDetailsDialog
          entry={detailsEntry}
          loading={detailsLoading}
          error={detailsError}
          onClose={() => {
            setDetailsEntryId(null);
            setDetailsEntry(null);
            setDetailsError("");
          }}
        />
      )}
      {deleteEntry && (
        <DeleteConfirmationDialog
          label="conversation entry"
          description="Delete this conversation entry? It will be removed from the timeline but can be retained in the audit history."
          onConfirm={deleteSelectedEntry}
          modeOptions={deleteEntry.deletedAt ? "permanent-only" : "soft-and-permanent"}
          onRecovery={() => setDeleteEntry(deleteEntry)}
          open
          onOpenChange={(open) => { if (!open) setDeleteEntry(null); }}
          trigger={null}
        />
      )}
    </section>
  );
}

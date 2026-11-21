import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowUpRight, FiCalendar, FiMapPin } from "react-icons/fi";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ProspectCreateDialog from "@/features/admin/components/ProspectCreateDialog";
import RestoreProspectButton from "@/features/admin/components/RestoreProspectButton";
import ProspectShareConfirmation from "@/features/admin/components/ProspectShareConfirmation";
import ProspectShareFeedback from "@/features/admin/components/ProspectShareFeedback";
import { AdminPagination } from "@/components/ui/pagination";
import {
  Prospect,
  type ProspectSource,
  type ProspectStatus,
} from "@/features/admin/models/prospect";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/features/admin/services/date-time";
import RecordBadge from "@/features/admin/components/RecordBadge";
import ProspectSearchInput from "@/features/admin/components/ProspectSearchInput";
import AdminQueryForm from "@/features/admin/components/AdminQueryForm";
import { parseArchiveFilter } from "@/features/admin/services/archive-filter";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;
const statuses: ProspectStatus[] = [
  "to-review",
  "ready-to-contact",
  "contacted",
  "responded",
  "converted",
  "not-a-fit",
];
const sources: ProspectSource[] = [
  "google-maps",
  "instagram",
  "linkedin",
  "website",
  "referral",
  "call",
  "other",
];
const statusLabels: Record<ProspectStatus, string> = {
  "to-review": "To review",
  "ready-to-contact": "Ready to contact",
  contacted: "Contacted",
  responded: "Responded",
  converted: "Converted",
  "not-a-fit": "Not a fit",
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    source?: string;
    followUp?: string;
    archive?: string;
    archived?: string;
    q?: string;
    share?: string;
    shareError?: string;
  }>;
}) {
  const session = await getCurrentAdminSession();
  if (!session) redirect("/admin/login");
  await connectToDatabase();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = statuses.includes(params.status as ProspectStatus)
    ? (params.status as ProspectStatus)
    : "";
  const source = sources.includes(params.source as ProspectSource)
    ? (params.source as ProspectSource)
    : "";
  const followUp = params.followUp === "due" ? "due" : "";
  const archive = parseArchiveFilter(
    params.archive ?? (params.archived === "true" ? "archived" : undefined),
  );
  const archived = archive === "archived";
  const query = params.q?.trim().slice(0, 100) ?? "";
  const filter: {
    status?: ProspectStatus;
    source?: ProspectSource;
    deletedAt?: { $exists: boolean };
    followUpAt?: { $exists: true; $lt: Date };
    $or?: Array<
      Partial<Record<"name" | "url" | "notes" | "nextAction", RegExp>>
    >;
  } = {};
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (archive !== "all") filter.deletedAt = { $exists: archived };
  if (followUp) {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    filter.followUpAt = { $exists: true, $lt: tomorrow };
  }
  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");
    filter.$or = [
      { name: regex },
      { url: regex },
      { notes: regex },
      { nextAction: regex },
    ];
  }
  const [prospects, total] = await Promise.all([
    Prospect.collection
      .find(filter)
      .sort({ followUpAt: 1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    Prospect.collection.countDocuments(filter),
  ]);
  const queryParams = Object.fromEntries(
    Object.entries({
      status,
      source,
      followUp,
      archive: archive === "active" ? "" : archive,
      q: query,
    }).filter(([, value]) => value),
  );

  return (
    <div className="mx-auto ">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">
            Prospects
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
            Keep promising businesses in view, plan a next step, and follow up
            when it’s time.
          </p>
        </div>
        <ProspectCreateDialog />
      </div>
      {params.share === "confirm" &&
        session.pendingShare &&
        session.pendingShare.expiresAt > new Date() && (
          <ProspectShareConfirmation pendingShare={session.pendingShare} />
        )}
      <ProspectShareFeedback
        result={
          params.share === "confirm" && session.pendingShare
            ? undefined
            : params.share
        }
        reason={params.shareError}
      />

      <section
        aria-labelledby="prospects-list-heading"
        className="mt-7 overflow-hidden rounded-2xl border border-[#e8e0da] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee8e2] px-5 py-4">
          <div>
            <h2 id="prospects-list-heading" className="font-semibold">
              Prospect list
            </h2>
            <p className="mt-1 text-sm text-black/55">
              {total} {total === 1 ? "record" : "records"}
            </p>
          </div>
        </div>
        <AdminQueryForm
          key={JSON.stringify([query, status, source, followUp, archive])}
          className="grid gap-3 border-b border-[#eee8e2] bg-[#fffdfb] p-4 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_12rem_12rem_12rem_12rem_auto]"
        >
          <label className="text-sm font-medium">
            Search
            <ProspectSearchInput key={query} defaultValue={query} />
          </label>
          <label className="text-sm font-medium">
            Status
            <select
              name="status"
              defaultValue={status}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329] cursor-pointer"
            >
              <option value="">All statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Source
            <select
              name="source"
              defaultValue={source}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329] cursor-pointer"
            >
              <option value="">All sources</option>
              {sources.map((value) => (
                <option key={value} value={value}>
                  {sourceLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Follow-up
            <select
              name="followUp"
              defaultValue={followUp}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329] cursor-pointer"
            >
              <option value="">All dates</option>
              <option value="due">Due or overdue</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Records
            <select
              name="archive"
              defaultValue={archive}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329] cursor-pointer"
            >
              <option value="active">Active prospects</option>
              <option value="archived">Archived prospects</option>
              <option value="all">All prospects</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Filter</Button>
            {(query ||
              status ||
              source ||
              followUp ||
              archive !== "active") && (
              <Link
                href="/admin/prospects"
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-black/60 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#602329]"
              >
                Clear
              </Link>
            )}
          </div>
        </AdminQueryForm>

        {prospects.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="font-semibold">
              {total
                ? "No prospects match these filters"
                : archived
                  ? "No archived prospects"
                  : "Your list starts here"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">
              {total
                ? "Try a different search or clear the filters."
                : archived
                  ? "Prospects you archive will appear here."
                  : "Save a business now, or share a link from your phone once the app is installed."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#eee8e2]">
            {prospects.map((prospect) => {
              const status = prospect.status as ProspectStatus;
              const due =
                prospect.followUpAt && prospect.followUpAt <= new Date();
              const isArchived = Boolean(prospect.deletedAt);
              return (
                <li key={String(prospect._id)}>
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      {isArchived ? (
                        <span className="inline-flex max-w-full items-center gap-1 font-semibold">
                          <span className="truncate">
                            {prospect.name ||
                              prospect.url ||
                              "Unnamed prospect"}
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={`/admin/prospects/${prospect._id}`}
                          className="inline-flex max-w-full items-center gap-1 font-semibold text-[#602329] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                        >
                          <span className="truncate">
                            {prospect.name ||
                              prospect.url ||
                              "Unnamed prospect"}
                          </span>
                          <FiArrowUpRight
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                        </Link>
                      )}
                      {prospect.name && prospect.url && (
                        <a
                          href={prospect.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block max-w-xl truncate text-sm text-black/55 underline decoration-black/20 underline-offset-2 hover:text-[#602329]"
                        >
                          {prospect.url}
                        </a>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black/55">
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin aria-hidden="true" />
                          {sourceLabels[prospect.source as ProspectSource]}
                        </span>
                        {prospect.followUpAt && (
                          <RecordBadge
                            status={due ? "due-overdue" : "due-later"}
                            label={
                              <>
                                <FiCalendar aria-hidden="true" />
                                Follow up{" "}
                                <time
                                  dateTime={prospect.followUpAt.toISOString()}
                                >
                                  {formatDateTime(prospect.followUpAt)}
                                </time>
                              </>
                            }
                          />
                        )}
                        {prospect.nextAction && (
                          <span className="max-w-full truncate">
                            Next: {prospect.nextAction}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RecordBadge
                        status={status}
                        label={statusLabels[status]}
                      />
                      {isArchived && (
                        <RestoreProspectButton id={String(prospect._id)} />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <AdminPagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          basePath="/admin/prospects"
          queryParams={queryParams}
        />
      </section>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FiActivity, FiDownload, FiSettings, FiShield, FiAlertTriangle } from "react-icons/fi";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Settings } from "@/features/admin/models/settings";
import { getServerEnv } from "@/lib/env";
import SettingsForm from "@/features/admin/components/SettingsForm";
import { Client } from "@/features/admin/models/client";
import ExportManager from "@/features/admin/components/ExportManager";
import RecordBadge from "@/features/admin/components/RecordBadge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/features/admin/components/Pagination";
import { sanitizeAuditMetadata } from "@/features/admin/services/audit";
import { escapeAuditSearch, parseAuditDate } from "@/features/admin/services/audit-filters";
import { Button } from "@/components/ui/button";
import HealthDashboard from "@/features/admin/components/HealthDashboard";
import OperationsLogPage from "@/features/admin/components/OperationsLogPage";

const sections = {
  audit: [
    "Audit log",
    "Review security-relevant actions and operational history.",
  ],
  operations: [
    "Operations log",
    "Investigate unexpected errors and security signals.",
  ],
  health: [
    "Health",
    "Check the status of required private services and configuration.",
  ],
  settings: [
    "Settings",
    "Manage dashboard preferences and setup instructions.",
  ],
  exports: ["Exports", "Prepare protected exports of selected business and operational data."],
} as const;

type AdminSearchParams = {
  page?: string | string[];
  q?: string | string[];
  actor?: string | string[];
  resourceType?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<AdminSearchParams>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { section } = await params;
  const queryParams = await searchParams;
  const requestedPage = Number(firstQueryValue(queryParams.page) || 1);
  const pageNumber = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const page = sections[section as keyof typeof sections];
  if (!page) notFound();

  if (section === "audit") {
    await connectToDatabase();
    const pageSize = 10;
    const search = firstQueryValue(queryParams.q).trim().slice(0, 100);
    const requestedActor = firstQueryValue(queryParams.actor);
    const actor = requestedActor === "admin" || requestedActor === "public"
      ? requestedActor
      : "";
    const resourceType = firstQueryValue(queryParams.resourceType).trim().slice(0, 100);
    const from = firstQueryValue(queryParams.from).trim();
    const to = firstQueryValue(queryParams.to).trim();
    const fromDate = parseAuditDate(from);
    const toDate = parseAuditDate(to, true);
    const invalidDateRange =
      (Boolean(from) && !fromDate) ||
      (Boolean(to) && !toDate) ||
      Boolean(fromDate && toDate && fromDate > toDate);
    const resourceTypes = (await AuditEvent.distinct("resourceType"))
      .filter((value): value is string => typeof value === "string")
      .sort((left, right) => left.localeCompare(right));
    const filter: Record<string, unknown> = {};
    if (actor) filter.actor = actor;
    if (resourceType) filter.resourceType = resourceType;
    if (search) {
      const matcher = new RegExp(escapeAuditSearch(search), "i");
      filter.$or = [
        { action: matcher },
        { resourceType: matcher },
        { resourceId: matcher },
        { resourceLabel: matcher },
        { requestId: matcher },
      ];
    }
    if (!invalidDateRange && (fromDate || toDate)) {
      filter.createdAt = {
        ...(fromDate ? { $gte: fromDate } : {}),
        ...(toDate ? { $lte: toDate } : {}),
      };
    }
    const queryString = {
      ...(search ? { q: search } : {}),
      ...(actor ? { actor } : {}),
      ...(resourceType ? { resourceType } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
    const [events, total] = await Promise.all([
      AuditEvent.find(invalidDateRange ? { _id: { $exists: false } } : filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AuditEvent.countDocuments(invalidDateRange ? { _id: { $exists: false } } : filter),
    ]);
    return (
      <div>
        <header className="mb-6 flex items-start gap-3 border-b border-black/10 pb-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329]">
            <FiShield aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Audit log
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
              Append-only records of authenticated and public operations.
            </p>
          </div>
        </header>
        <form
          method="get"
          action="/admin/audit"
          className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-black/10 bg-[#f7f4f1] p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm font-medium">
            Search
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={search}
              placeholder="Action, resource, or reference"
              className="mt-1.5 min-h-10 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
            />
          </label>
          <label className="text-sm font-medium">
            Actor
            <select
              name="actor"
              defaultValue={actor}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
            >
              <option value="">All actors</option>
              <option value="admin">Admin</option>
              <option value="public">Public</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Resource type
            <select
              name="resourceType"
              defaultValue={resourceType}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
            >
              <option value="">All resource types</option>
              {resourceTypes.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            From
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
            />
          </label>
          <label className="text-sm font-medium">
            Through
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1.5 min-h-10 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
            />
          </label>
          {invalidDateRange && (
            <p role="alert" className="text-sm text-red-800 sm:col-span-2 lg:col-span-5">
              Enter valid dates and make sure the start date is not after the end date.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2 lg:col-span-5">
            <Button type="submit">Apply filters</Button>
            <Link
              href="/admin/audit"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-black/15 bg-white px-4 text-sm font-medium text-black/80 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
            >
              Clear filters
            </Link>
          </div>
        </form>
        <p className="mb-3 text-sm text-black/55" aria-live="polite">
          {total} {total === 1 ? "event" : "events"} found
        </p>
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="w-[35%] min-w-[280px]">Details</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>No audit events yet.</TableCell>
                </TableRow>
              )}
              {events.map((event) => (
                <TableRow key={String(event._id)}>
                  <TableCell className="font-medium">
                    <span className="mb-1 block text-[11px] font-normal uppercase tracking-wide text-black/50">
                      {event.actor}
                    </span>
                    {event.action}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {event.resourceLabel || event.resourceType}
                    </p>
                    <p className="mt-1 text-xs text-black/45">
                      {event.resourceType}
                      {event.resourceId ? ` · ${event.resourceId}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="w-[35%] min-w-[280px] text-sm text-black/55">
                    {Object.entries(sanitizeAuditMetadata(event.metadata))
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(" · ") || "—"}
                    <p className="mt-1 break-all text-xs text-black/45">
                      Ref {event.requestId}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-xs text-black/45">
                    <time>{event.createdAt.toLocaleString()}</time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </Card>
        <Pagination
          page={pageNumber}
          total={total}
          pageSize={pageSize}
          basePath="/admin/audit"
          queryParams={queryString}
        />
      </div>
    );
  }

  if (section === "health") {
    return (
      <div>
        <header className="mb-6 flex items-start gap-3 border-b border-black/10 pb-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329]">
            <FiActivity aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Health
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
              Safe service summaries for the private workspace.
            </p>
          </div>
        </header>
        <HealthDashboard />
      </div>
    );
  }

  if (section === "operations") {
    return <OperationsLogPage />;
  }

  if (section === "settings") {
    await connectToDatabase();
    const saved = await Settings.findOne({ key: "dashboard" }).lean();
    const env = getServerEnv();
    return (
      <div>
        <header className="mb-6 flex items-start gap-3 border-b border-black/10 pb-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329]">
            <FiSettings aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
              Preferences affect dashboard display and reply defaults only.
            </p>
          </div>
        </header>
        <div>
          <SettingsForm
            initial={{
              displayName:
                saved?.displayName ??
                env.ADMIN_DISPLAY_NAME ??
                "NLarge administrator",
              timezone: saved?.timezone ?? "Asia/Kolkata",
              dateFormat: saved?.dateFormat ?? "dd MMM yyyy",
              emailSignature:
                saved?.emailSignature ?? "Best regards,\nNLarge Global",
              defaultReplyTemplate:
                saved?.defaultReplyTemplate ??
                "Thank you for your message. We will review this and get back to you shortly.",
            }}
          />
        </div>
      </div>
    );
  }

  await connectToDatabase();
  const clients = await Client.find()
    .setOptions({ includeDeleted: true })
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return (
    <div>
      <header className="mb-6 flex items-start gap-3 border-b border-black/10 pb-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329]">
          <FiDownload aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Data exports
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Create protected exports for client records, prospects, subscribers, inquiries, audit, and operations.
          </p>
        </div>
      </header>
      <ExportManager
        clients={clients.map((client) => ({
          _id: String(client._id),
          name: client.name,
          archived: Boolean(client.deletedAt),
        }))}
      />
    </div>
  );
}

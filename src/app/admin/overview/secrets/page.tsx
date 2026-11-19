import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowUpRight, FiClock, FiKey } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import Pagination from "@/features/admin/components/Pagination";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Client } from "@/features/admin/models/client";
import { Project } from "@/features/admin/models/project";
import { Secret } from "@/features/admin/models/secret";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/features/admin/services/date-time";
import RecordBadge from "@/features/admin/components/RecordBadge";
import AdminListFilters from "@/features/admin/components/AdminListFilters";
import {
  getArchiveQuery,
  includesArchived,
  parseArchiveFilter,
} from "@/features/admin/services/archive-filter";

const PAGE_SIZE = 10;

function daysUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

function urgency(days: number) {
  if (days <= 7) return { label: "Expires soon", status: "due-soon" };
  if (days <= 14) return { label: "Within 2 weeks", status: "pending" };
  return { label: "Upcoming", status: "due-later" };
}

export default async function OverviewSecretsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; archive?: string; type?: string }>;
}) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const archive = parseArchiveFilter(params.archive);
  const secretTypes = ["username-password", "api-key", "token", "connection-string", "environment-file", "certificate", "recovery-codes", "other"] as const;
  const type = secretTypes.includes(params.type as (typeof secretTypes)[number])
    ? params.type!
    : "";
  const now = new Date();
  const filter: Record<string, unknown> = {
    ...getArchiveQuery(archive),
    ...(type ? { type } : {}),
    expiresAt: { $gte: now, $lte: new Date(now.getTime() + 30 * 86_400_000) },
  };
  const options = { includeDeleted: includesArchived(archive) };
  const [secrets, total] = await Promise.all([
    Secret.find(filter)
      .setOptions(options)
      .sort({ expiresAt: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select("label type expiresAt clientId projectId")
      .lean(),
    Secret.countDocuments(filter).setOptions(options),
  ]);
  const [clients, projects] = await Promise.all([
    Client.find({ _id: { $in: secrets.map((secret) => secret.clientId) } })
      .select("_id name")
      .lean(),
    Project.find({
      _id: { $in: secrets.flatMap((secret) => secret.projectId ? [secret.projectId] : []) },
    })
      .select("_id name")
      .lean(),
  ]);
  const clientMap = new Map(clients.map((client) => [String(client._id), client.name]));
  const projectMap = new Map(projects.map((project) => [String(project._id), project]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Expiring secrets</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            A focused view of credentials that need attention in the next 30 days.
          </p>
        </div>
        <div className="rounded-2xl border border-[#602329]/15 bg-[#602329]/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#602329]">Needs attention</p>
          <p className="mt-1 text-2xl font-semibold text-[#602329]">{total}</p>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <AdminListFilters
          fields={[
            {
              name: "archive",
              label: "Records",
              value: archive,
              options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
                { value: "all", label: "All records" },
              ],
            },
            {
              name: "type",
              label: "Secret type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...secretTypes.map((value) => ({
                  value,
                  label: value.replaceAll("-", " "),
                })),
              ],
            },
          ]}
        />
        {secrets.length === 0 ? (
          <div className="grid min-h-48 place-items-center px-6 py-10 text-center">
            <div>
              <FiKey aria-hidden="true" className="mx-auto size-6 text-black/35" />
              <p className="mt-3 font-medium">No secrets need attention</p>
              <p className="mt-1 text-sm text-black/50">Everything is outside the 30-day expiry window.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {secrets.map((secret) => {
              const project = secret.projectId ? projectMap.get(String(secret.projectId)) : undefined;
              const days = secret.expiresAt ? daysUntil(secret.expiresAt) : 0;
              const state = urgency(days);
              const href = project
                ? `/admin/clients/${secret.clientId}/projects/${secret.projectId}/secrets`
                : `/admin/clients/${secret.clientId}`;
              return (
                <Link
                  key={String(secret._id)}
                  href={href}
                  className="group flex flex-wrap items-center justify-between gap-5 px-5 py-5 transition-colors hover:bg-[#faf2ec] sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-[#602329]/10 text-[#602329]">
                      <FiKey aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{secret.label}</p>
                        <RecordBadge status={state.status} label={state.label} />
                      </div>
                      <p className="mt-1 text-sm capitalize text-black/50">
                        {secret.type.replaceAll("-", " ")} · {clientMap.get(String(secret.clientId)) ?? "Unknown client"}
                        {project ? ` · ${project.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1.5 text-sm font-semibold text-[#602329]">
                        <FiClock aria-hidden="true" />
                        {days === 0 ? "Today" : `${days} days`}
                      </div>
                      <time className="mt-1 block text-xs text-black/45" dateTime={secret.expiresAt?.toISOString()}>
                        {formatDateTime(secret.expiresAt)}
                      </time>
                    </div>
                    <FiArrowUpRight aria-hidden="true" className="size-4 text-black/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/admin/overview/secrets" queryParams={{ archive, ...(type ? { type } : {}) }} />
      </Card>
    </div>
  );
}

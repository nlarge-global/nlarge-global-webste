"use client";

import { useEffect, useState } from "react";
import {
  operationCategories,
  operationSeverities,
  type OperationCategory,
  type OperationSeverity,
} from "@/features/admin/services/operations-types";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";

type OperationsEvent = {
  _id: string;
  category: OperationCategory;
  severity: OperationSeverity;
  event: string;
  source: "server" | "client";
  route: string;
  method: string;
  status?: number;
  resourceType?: string;
  resourceId?: string;
  recordCount?: number;
  message: string;
  errorName?: string;
  stack?: string;
  requestId: string;
  ipAddress: string;
  userAgent: string;
  occurrences?: number;
  lastSeenAt?: string;
  createdAt: string;
};

const severityStyles: Record<OperationSeverity, string> = {
  critical: "bg-red-100 text-red-900",
  high: "bg-orange-100 text-orange-900",
  medium: "bg-amber-100 text-amber-950",
  low: "bg-stone-100 text-stone-800",
};

const categoryLabels: Record<OperationCategory, string> = {
  security: "Security",
  "data-access": "Data access",
  "data-integrity": "Data changes",
  availability: "Availability",
  application: "Application",
};

export default function OperationsLogPage() {
  const [events, setEvents] = useState<OperationsEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      ...(category ? { category } : {}),
      ...(severity ? { severity } : {}),
    });
    fetch(`/api/admin/operations?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as {
          events?: OperationsEvent[];
          total?: number;
          priorityCounts?: Record<string, number>;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error ?? "Unable to load operations logs.");
        setEvents(result.events ?? []);
        setTotal(result.total ?? 0);
        setCounts(result.priorityCounts ?? {});
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load operations logs.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, page, refreshVersion, severity]);

  const pageCount = Math.max(1, Math.ceil(total / 25));
  const hasFilters = Boolean(category || severity);

  return (
    <div>
      <header className="mb-6 border-b border-black/10 pb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Operations log
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
          Unexpected failures and security signals. Sensitive request contents are not recorded; entries expire after 90 days.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-red-100 flex items-center justify-center px-4 font-semibold text-red-900">
            Critical {counts.critical ?? 0}
          </span>
          <span className="rounded-full bg-orange-100 flex items-center justify-center px-4 font-semibold text-orange-900">
            High {counts.high ?? 0}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={loading}
            onClick={() => setRefreshVersion((version) => version + 1)}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </header>

      <form
        className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-black/10 bg-[#f7f4f1] p-4 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="text-sm font-medium">
          Category
          <Select
            value={category}
            className="mt-1.5"
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {operationCategories.map((value) => (
              <option key={value} value={value}>{categoryLabels[value]}</option>
            ))}
          </Select>
        </label>
        <label className="text-sm font-medium">
          Severity
          <Select
            value={severity}
            className="mt-1.5"
            onChange={(event) => {
              setSeverity(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All severities</option>
            {operationSeverities.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Select>
        </label>
        <div className="flex items-end justify-start sm:col-span-2 lg:col-span-1 lg:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!hasFilters}
            onClick={() => {
              setCategory("");
              setSeverity("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        </div>
      </form>

      {error && <p role="alert" className="mb-4 text-sm text-red-800">{error}</p>}
      <section aria-label="Operational events" aria-busy={loading} className="space-y-3">
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-black/60">Loading operations logs…</p>
        ) : events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-black/60">
            No events match these filters.
          </p>
        ) : events.map((event) => (
          <article key={event._id} className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${severityStyles[event.severity]}`}>
                {event.severity}
              </span>
              <span className="text-sm font-semibold">{categoryLabels[event.category]}</span>
              <span className="text-xs text-black/55">{event.event.replaceAll(".", " ")}</span>
              <time className="ml-auto text-xs tabular-nums text-black/55" dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="mt-3 break-words text-sm">{event.message}</p>
            {(event.occurrences ?? 1) > 1 && (
              <p className="mt-1 text-xs font-medium text-black/60">
                Repeated {event.occurrences} times · Last seen{" "}
                {new Date(event.lastSeenAt ?? event.createdAt).toLocaleString()}
              </p>
            )}
            <p className="mt-2 break-all text-xs text-black/60">
              {event.method} {event.route}
              {event.status ? ` · HTTP ${event.status}` : ""}
              {event.resourceType ? ` · ${event.resourceType} ${event.resourceId ?? ""}` : ""}
              {event.recordCount !== undefined ? ` · ${event.recordCount} records` : ""}
              {" · "}Ref {event.requestId}
            </p>
            <details className="mt-3 border-t border-black/10 pt-3">
              <summary className="w-fit cursor-pointer text-sm font-medium text-[#602329] underline underline-offset-2">
                Technical details
              </summary>
              <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="font-semibold">Source</dt><dd>{event.source}</dd>
                <dt className="font-semibold">IP address</dt><dd>{event.ipAddress}</dd>
                <dt className="font-semibold">Device / browser</dt><dd className="break-all">{event.userAgent}</dd>
                {event.errorName && <><dt className="font-semibold">Error type</dt><dd>{event.errorName}</dd></>}
              </dl>
              {event.stack && (
                <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#f5f3f0] p-3 text-xs">
                  {event.stack}
                </pre>
              )}
            </details>
          </article>
        ))}
      </section>
      {pageCount > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-sm">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button type="button" variant="outline" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

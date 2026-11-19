import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import DeleteRowAction from "./DeleteRowAction";
import { AdminPagination } from "@/components/ui/pagination";
import RecordBadge from "./RecordBadge";
import type { ReactNode } from "react";
import { formatDateTime } from "@/features/admin/services/date-time";

type RecordRow = {
  id: string;
  title: string;
  detail: string;
  person?: string;
  preview?: string;
  email?: string;
  status?: string;
  priority?: string;
  meta?: string;
  createdAt?: string;
  href?: string;
  deleteEndpoint?: string;
  deleteDescription?: string;
};

export default function AdminRecordsPage({
  title,
  description,
  rows,
  pagination,
  action,
  filters,
}: {
  title: string;
  description: string;
  rows: RecordRow[];
  action?: ReactNode;
  filters?: ReactNode;
  pagination?: {
    page: number;
    total: number;
    pageSize?: number;
    basePath: string;
    queryParams?: Record<string, string>;
  };
}) {
  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            {description}
          </p>
        </div>
        {action}
      </header>
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
          <div className="font-semibold text-xl">{title}</div>
          <div>{filters}</div>
        </div>
        {rows.length === 0 ? (
          <CardContent>
            <p className="text-sm text-black/60">No {title.toLowerCase()} yet.</p>
            <p className="mt-1 text-sm text-black/45">
              New records will appear here when they arrive.
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-black/10">
            {rows.map((row) => (
              <article
                key={row.id}
                className="grid gap-3 p-4 transition-colors hover:bg-[#faf2ec] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="font-semibold text-[#602329] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                      >
                        {row.title}
                      </Link>
                    ) : (
                      <h2 className="font-semibold">{row.title}</h2>
                    )}
                    {row.status && (
                      <RecordBadge status={row.status} />
                    )}
                    {row.priority && row.priority !== "normal" && (
                      <RecordBadge
                        status={row.priority}
                        label={`${row.priority} priority`}
                      />
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-black/65">
                    {row.email ? (
                      <>
                        {row.person || row.detail}
                        <span aria-hidden="true"> · </span>
                        <a className="underline decoration-black/20 underline-offset-2 hover:text-[#602329]" href={`mailto:${row.email}`}>
                          {row.email}
                        </a>
                      </>
                    ) : row.detail}
                  </p>
                  {row.preview && (
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-5 text-black/55">
                      {row.preview}
                    </p>
                  )}
                  {(row.meta || row.createdAt) && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/50">
                      {row.meta && <span className="capitalize">{row.meta.replaceAll("-", " ")}</span>}
                      {row.meta && row.createdAt && <span aria-hidden="true">·</span>}
                      {row.createdAt && (
                        <time dateTime={row.createdAt}>
                          {formatDateTime(row.createdAt)}
                        </time>
                      )}
                    </p>
                  )}
                </div>
                {row.deleteEndpoint && (
                  <div className="flex justify-end sm:pl-3">
                    <DeleteRowAction
                      endpoint={row.deleteEndpoint}
                      label={`Archive ${row.title}`}
                      description={
                        row.deleteDescription ??
                        `Archive ${row.title} and remove it from active records?`
                      }
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {pagination && <AdminPagination {...pagination} />}
      </Card>
    </div>
  );
}

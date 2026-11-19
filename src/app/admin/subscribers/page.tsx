import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import RecordBadge from "@/features/admin/components/RecordBadge";
import { AdminPagination } from "@/components/ui/pagination";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import SubscriberDeleteAction from "@/features/admin/components/SubscriberDeleteAction";
import { Subscriber } from "@/features/contact/models/subscriber";
import { connectToDatabase } from "@/lib/mongodb";
import Link from "next/link";

const PAGE_SIZE = 10;

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const requestedPage = Number((await searchParams).page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const total = await Subscriber.countDocuments();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const subscribers = await Subscriber.find()
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Subscribers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Export opted-in addresses from the protected Exports workspace.
          </p>
        </div>
        <Link
          href="/admin/exports"
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#602329] px-4 text-sm font-medium text-white hover:bg-[#4e1d22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
        >
          Go to exports
        </Link>
      </header>

      <Card className="mt-6 overflow-hidden">
        {subscribers.length === 0 ? (
          <div className="p-6">
            <p className="font-semibold">No subscribers yet.</p>
            <p className="mt-1 text-sm text-black/55">
              People who opt in on the contact form will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {subscribers.map((subscriber) => {
              const latestGrant = [...subscriber.consentEvents]
                .reverse()
                .find((event) => event.action === "granted");
              return (
                <article
                  key={String(subscriber._id)}
                  className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="break-all font-semibold">{subscriber.email}</h2>
                      <RecordBadge status={subscriber.status} />
                    </div>
                    <p className="mt-2 text-sm text-black/55">
                      {latestGrant
                        ? `Consent version ${latestGrant.version} · ${latestGrant.occurredAt.toLocaleString()} · ${latestGrant.source}`
                        : "No consent event recorded"}
                      {subscriber.unsubscribedAt
                        ? ` · Unsubscribed ${subscriber.unsubscribedAt.toLocaleString()}`
                        : ""}
                    </p>
                    {subscriber.consentEvents.length > 0 && (
                      <details className="mt-3">
                        <summary className="w-fit cursor-pointer text-sm font-semibold text-[#602329] underline underline-offset-4">
                          View consent history
                        </summary>
                        <ol className="mt-3 space-y-3">
                          {subscriber.consentEvents.map((event, index) => (
                            <li
                              key={`${event.action}-${event.sourceId ?? event.occurredAt.toISOString()}-${index}`}
                              className="rounded-xl bg-[#f1efea] p-4 text-sm leading-6"
                            >
                              <p className="font-semibold">
                                {event.action === "granted" ? "Marketing opt-in" : "Unsubscribe"}
                                {" · "}{event.version}
                              </p>
                              <p className="mt-1 text-black/60">
                                {event.occurredAt.toLocaleString()} · {event.source}
                              </p>
                              <p className="mt-2 text-black/75">{event.text}</p>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                  <SubscriberDeleteAction id={String(subscriber._id)} />
                </article>
              );
            })}
          </div>
        )}
        <AdminPagination
          page={currentPage}
          total={total}
          pageSize={PAGE_SIZE}
          basePath="/admin/subscribers"
        />
      </Card>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { FiDownload } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminPagination } from "@/components/ui/pagination";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import SubscriberDeleteAction from "@/features/admin/components/SubscriberDeleteAction";
import { Subscriber } from "@/features/contact/models/subscriber";
import { connectToDatabase } from "@/lib/mongodb";

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
            Only opted-in addresses are included in the marketing export.
          </p>
        </div>
        <Link
          href="/api/admin/subscribers/export"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[#602329] px-5 text-sm font-semibold text-white hover:bg-[#481a1e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]"
        >
          <FiDownload aria-hidden="true" />
          Export subscribed CSV
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
                      <Badge variant={subscriber.status === "subscribed" ? "success" : "secondary"}>
                        {subscriber.status}
                      </Badge>
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

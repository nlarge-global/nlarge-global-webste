import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowUpRight, FiChevronLeft } from "react-icons/fi";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ProspectArchiveButton from "@/features/admin/components/ProspectArchiveButton";
import ProspectEditor from "@/features/admin/components/ProspectEditor";
import ProspectActivityTimeline from "@/features/admin/components/ProspectActivityTimeline";
import { Prospect } from "@/features/admin/models/prospect";
import { ProspectActivity } from "@/features/admin/models/prospect-activity";
import { connectToDatabase } from "@/lib/mongodb";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectToDatabase();
  const prospect = await Prospect.findById(id).lean();
  if (!prospect) notFound();
  const activities = await ProspectActivity.find({ prospectId: prospect._id })
    .sort({ _id: -1 })
    .limit(21)
    .lean();
  const initialActivities = activities.slice(0, 20).map((activity) => ({
    id: String(activity._id),
    type: activity.type,
    content: activity.content,
    occurredAt: activity.occurredAt.toISOString(),
  }));
  const displayName = prospect.name || prospect.url || "Unnamed prospect";

  return (
    <div className="mx-auto">
      <Link
        href="/admin/prospects"
        className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[#602329] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
      >
        <FiChevronLeft aria-hidden="true" />
        Prospects
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-semibold tracking-[-0.04em]">
            {displayName}
          </h1>
          <p className="mt-2 text-sm text-black/55">
            Added{" "}
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeZone: "UTC",
            }).format(prospect.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {prospect.url && (
            <a
              href={prospect.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-medium text-[#602329] hover:bg-[#faf4f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
            >
              Open website <FiArrowUpRight aria-hidden="true" />
            </a>
          )}
          <ProspectArchiveButton id={id} />
        </div>
      </div>
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.18fr)]">
        <ProspectEditor
          prospect={{
            id,
            name: prospect.name ?? "",
            url: prospect.url ?? "",
            source: prospect.source,
            status: prospect.status,
            notes: prospect.notes ?? "",
            nextAction: prospect.nextAction ?? "",
            followUpAt: prospect.followUpAt?.toISOString().slice(0, 10) ?? "",
          }}
        />
        <ProspectActivityTimeline
          prospectId={id}
          initialActivities={initialActivities}
          hasMore={activities.length > 20}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/features/admin/services/date-time";
import { Inquiry } from "@/features/admin/models/inquiry";
import { Client } from "@/features/admin/models/client";
import { Secret } from "@/features/admin/models/secret";
import { PaymentRecord } from "@/features/admin/models/payment";
import { Task } from "@/features/admin/models/task";
import { Project } from "@/features/admin/models/project";
import { AuditEvent } from "@/features/admin/models/audit-event";
import RecordBadge from "@/features/admin/components/RecordBadge";

export default async function OverviewPage() {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const now = new Date();
  const [
    newInquiries,
    totalClients,
    expiringSecrets,
    outstandingPayments,
    recentInquiries,
    upcomingTasks,
    recentActivity,
  ] = await Promise.all([
    Inquiry.countDocuments({ status: "new" }),
    Client.countDocuments(),
    Secret.countDocuments({
      expiresAt: {
        $gte: now,
        $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    PaymentRecord.countDocuments({
      status: { $in: ["pending", "partial", "overdue"] },
    }),
    Inquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("subject name status createdAt")
      .lean(),
    Task.find({ status: { $ne: "done" }, dueDate: { $gte: now } })
      .sort({ dueDate: 1 })
      .limit(5)
      .select("title status priority dueDate clientId projectId")
      .lean(),
    AuditEvent.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("action resourceType resourceLabel createdAt")
      .lean(),
  ]);
  const projectIds = upcomingTasks
    .map((task) => task.projectId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select("_id name clientId")
    .lean();
  const projectMap = new Map(
    projects.map((project) => [String(project._id), project]),
  );
  const cards = [
    ["New inquiries", newInquiries, "/admin/inquiries"],
    ["Total clients", totalClients, "/admin/clients"],
    ["Expiring secrets", expiringSecrets, "/admin/overview/secrets"],
    ["Outstanding payments", outstandingPayments, "/admin/overview/payments"],
  ] as const;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, href], index) => (
          <Link
            key={label}
            href={href}
            className={`rounded-2xl border border-black/10 p-5 transition-transform hover:-translate-y-0.5 hover:border-[#602329] ${index === 0 ? "bg-[#602329] text-white" : "bg-white"}`}
          >
            <p
              className={`text-sm ${index === 0 ? "text-white/65" : "text-black/50"}`}
            >
              {label}
            </p>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">
              {value}
            </p>
            <span
              className={`mt-4 block text-xs ${index === 0 ? "text-white/55" : "text-black/45"}`}
            >
              View details →
            </span>
          </Link>
        ))}
      </div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Upcoming tasks</h2>
            <p className="mt-1 text-sm text-black/50">
              The next tasks due across active projects.
            </p>
          </div>
        </div>
        <div className="mt-4 divide-y divide-black/10">
          {upcomingTasks.length === 0 && (
            <p className="py-5 text-sm text-black/50">No upcoming tasks.</p>
          )}
          {upcomingTasks.map((task) => {
            const project = task.projectId
              ? projectMap.get(String(task.projectId))
              : undefined;
            return (
              <Link
                key={String(task._id)}
                href={`/admin/clients/${task.clientId}/projects/${task.projectId}`}
                className="block py-4 hover:text-[#602329]"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">{task.title}</p>
                  <RecordBadge status={task.priority} />
                </div>
                <p className="mt-1 text-sm text-black/50">
                  {project?.name ?? "Unassigned project"}
                </p>
                {task.dueDate && (
                  <RecordBadge
                    className="mt-2"
                    status="due-later"
                    label={`Due ${formatDateTime(task.dueDate)}`}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent inquiries</h2>
              <p className="mt-1 text-sm text-black/50">
                Latest across all statuses.
              </p>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-sm font-semibold text-[#602329]"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-black/10">
            {recentInquiries.length === 0 && (
              <p className="py-5 text-sm text-black/50">No inquiries yet.</p>
            )}
            {recentInquiries.map((inquiry) => (
              <Link
                key={String(inquiry._id)}
                href={`/admin/inquiries/${inquiry._id}`}
                className="block py-4 hover:text-[#602329]"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">{inquiry.subject}</p>
                  <RecordBadge status={inquiry.status} />
                </div>
                <p className="mt-1 text-sm text-black/50">
                  {inquiry.name} ·{" "}
                  {formatDateTime(inquiry.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent activity</h2>
              <p className="mt-1 text-sm text-black/50">
                Latest recorded operations.
              </p>
            </div>
            <Link
              href="/admin/audit"
              className="text-sm font-semibold text-[#602329]"
            >
              Audit log
            </Link>
          </div>
          <div className="mt-4 divide-y divide-black/10">
            {recentActivity.length === 0 && (
              <p className="py-5 text-sm text-black/50">No activity yet.</p>
            )}
            {recentActivity.map((event) => (
              <div key={String(event._id)} className="py-3">
                <p className="text-sm font-medium">{event.action}</p>
                <p className="mt-1 text-xs text-black/55">{event.resourceLabel || event.resourceType}</p>
                <p className="mt-1 text-xs text-black/45">
                  {event.resourceType} ·{" "}
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import AdminPlaceholderPage from "@/features/admin/components/AdminPlaceholderPage";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Inquiry } from "@/features/admin/models/inquiry";
import { Client } from "@/features/admin/models/client";
import { Secret } from "@/features/admin/models/secret";
import { PaymentRecord } from "@/features/admin/models/payment";
import { Task } from "@/features/admin/models/task";
import { AuditEvent } from "@/features/admin/models/audit-event";
import Link from "next/link";
import HelpTooltip from "@/features/admin/components/HelpTooltip";

export default async function AdminOverviewPage() {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [newInquiries, recentInquiries, totalClients, activeClients, expiringSecrets, outstandingPayments, overdueTasks, upcomingTasks, recentActivity] = await Promise.all([
    Inquiry.countDocuments({ status: "new" }),
    Inquiry.find().sort({ createdAt: -1 }).limit(5).select("subject name status createdAt").lean(),
    Client.countDocuments(),
    Client.countDocuments({ "tags": { $nin: ["archived"] } }),
    Secret.countDocuments({ expiresAt: { $gte: now, $lte: inThirtyDays } }),
    PaymentRecord.countDocuments({ status: { $in: ["pending", "partial", "overdue"] } }),
    Task.countDocuments({ status: { $ne: "done" }, dueDate: { $lt: now } }),
    Task.countDocuments({ status: { $ne: "done" }, dueDate: { $gte: now, $lte: inThirtyDays } }),
    AuditEvent.find().sort({ createdAt: -1 }).limit(6).select("action resourceType createdAt").lean(),
  ]);
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["New inquiries", newInquiries, "/admin/inquiries"],
          ["Total clients", totalClients, "/admin/clients"],
          ["Expiring secrets", expiringSecrets, "/admin/clients"],
          ["Outstanding payments", outstandingPayments, "/admin/clients"],
          ["Overdue tasks", overdueTasks, "/admin/projects"],
          ["Upcoming tasks", upcomingTasks, "/admin/projects"],
          ["Active clients", activeClients, "/admin/clients"],
          ["Recent activity", recentActivity.length, "/admin/audit"],
        ].map(([label, value, href], index) => <Link key={String(label)} href={String(href)} className={`rounded-2xl border border-black/10 p-5 transition-transform hover:-translate-y-0.5 hover:border-[#602329] ${index === 0 ? "bg-[#602329] text-white" : "bg-white"}`}><p className={`text-sm ${index === 0 ? "text-white/65" : "text-black/50"}`}>{label}</p><p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">{String(value)}</p><span className={`mt-4 block text-xs ${index === 0 ? "text-white/55" : "text-black/35"}`}>View details →</span></Link>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Recent inquiries</h2><p className="mt-1 text-sm text-black/50">Latest across all statuses.</p></div><Link href="/admin/inquiries" className="text-sm font-semibold text-[#602329]">View all</Link></div>
          <div className="mt-4 divide-y divide-black/10">{recentInquiries.length === 0 && <p className="py-5 text-sm text-black/50">No inquiries yet.</p>}{recentInquiries.map((inquiry) => <Link key={String(inquiry._id)} href={`/admin/inquiries/${inquiry._id}`} className="block py-4 hover:text-[#602329]"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{inquiry.subject}</p><span className="text-xs capitalize text-black/45">{inquiry.status}</span></div><p className="mt-1 text-sm text-black/50">{inquiry.name} · {new Date(inquiry.createdAt).toLocaleDateString()}</p></Link>)}</div>
        </section>
        <section className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-black/50">Latest recorded operations.</p></div><Link href="/admin/audit" className="text-sm font-semibold text-[#602329]">Audit log</Link></div><div className="mt-4 divide-y divide-black/10">{recentActivity.length === 0 && <p className="py-5 text-sm text-black/50">No activity yet.</p>}{recentActivity.map((event) => <div key={String(event._id)} className="py-3"><p className="text-sm font-medium">{event.action}</p><p className="mt-1 text-xs text-black/45">{event.resourceType} · {new Date(event.createdAt).toLocaleString()}</p></div>)}</div></section>
      </div>
      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Admin actions</h2><p className="mt-1 text-sm text-black/50">Guidance for recurring operator checks, not an automated checklist.</p></div><HelpTooltip label="Admin actions">Use these links as a small operating rhythm. They do not represent completed work automatically.</HelpTooltip></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["Review new inquiries", "/admin/inquiries", "Process new leads and decide the next action."], ["Check overdue follow-ups", "/admin/projects", "Keep commitments visible before they become missed."], ["Review expiring credentials", "/admin/clients", "Rotate or revoke secrets before they expire."], ["Verify service health", "/admin/health", "Check MongoDB, SMTP, and R2 before relying on them."], ["Review audit events", "/admin/audit", "Look for failed or unexpected operations."], ["Export or offboard client data", "/admin/exports", "Prepare a deliberate handover when work ends."]].map(([label, href, description]) => <Link key={label} href={href} className="rounded-xl border border-black/10 p-4 hover:border-[#602329]"><div className="flex items-center justify-between gap-2"><span className="font-medium">{label}</span><HelpTooltip label={label}>{description}</HelpTooltip></div><p className="mt-2 text-sm leading-6 text-black/50">{description}</p></Link>)}</div></section>
    </div>
  );
}

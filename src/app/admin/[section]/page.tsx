import { notFound } from "next/navigation";
import AdminPlaceholderPage from "@/features/admin/components/AdminPlaceholderPage";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { connectToDatabase } from "@/lib/mongodb";
import { getHealthChecks } from "@/features/admin/services/health";
import { Settings } from "@/features/admin/models/settings";
import { getServerEnv } from "@/lib/env";
import SettingsForm from "@/features/admin/components/SettingsForm";
import { Client } from "@/features/admin/models/client";
import ExportManager from "@/features/admin/components/ExportManager";
import AdminRecordsPage from "@/features/admin/components/AdminRecordsPage";
import { Inquiry } from "@/features/admin/models/inquiry";
import { Secret } from "@/features/admin/models/secret";
import { ClientDocument } from "@/features/admin/models/document";
import { PaymentRecord } from "@/features/admin/models/payment";
import { Project } from "@/features/admin/models/project";

const sections = {
  inquiries: ["Inquiries", "Review and organize incoming project enquiries and follow-ups."],
  clients: ["Clients", "Keep a focused view of client relationships and linked work."],
  projects: ["Projects", "Track delivery details, environments, deadlines, and tasks."],
  secrets: ["Secrets", "Manage encrypted client credentials with deliberate access controls."],
  documents: ["Documents", "Store and access private client documents safely."],
  payments: ["Payments", "Track milestones, payment status, references, and proof documents."],
  audit: ["Audit log", "Review security-relevant actions and operational history."],
  health: ["Health", "Check the status of required private services and configuration."],
  settings: ["Settings", "Manage dashboard preferences and setup instructions."],
  exports: ["Exports", "Prepare authenticated client handover packages."],
} as const;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { section } = await params;
  const page = sections[section as keyof typeof sections];
  if (!page) notFound();

  if (section === "audit") {
    await connectToDatabase();
    const events = await AuditEvent.find().sort({ createdAt: -1 }).limit(50).lean();
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Audit log</h1>
        <p className="mt-2 text-sm text-black/55">Append-only records of authenticated and public operations.</p>
        <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="divide-y divide-black/10">
            {events.length === 0 && <p className="p-5 text-sm text-black/50">No audit events yet.</p>}
            {events.map((event) => <div key={String(event._id)} className="grid gap-1 p-5 text-sm sm:grid-cols-[1fr_auto]"><div><p className="font-medium">{event.action}</p><p className="mt-1 text-black/50">{event.resourceType}{event.resourceId ? ` · ${event.resourceId}` : ""}</p></div><time className="text-xs text-black/45">{event.createdAt.toLocaleString()}</time></div>)}
          </div>
        </section>
        <Link href="/admin" className="mt-5 inline-block text-sm font-semibold text-[#602329]">Back to overview</Link>
      </div>
    );
  }
  if (section === "health") {
    const checks = await getHealthChecks();
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Health</h1>
        <p className="mt-2 text-sm text-black/55">Safe service summaries for the private workspace.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{Object.entries(checks).map(([name, check]) => <section key={name} className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold capitalize">{name}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${check.status === "ok" ? "bg-emerald-100 text-emerald-800" : check.status === "error" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{check.status}</span></div><p className="mt-3 text-sm leading-6 text-black/55">{check.message}</p></section>)}</div>
      </div>
    );
  }
  if (section === "settings") {
    await connectToDatabase();
    const saved = await Settings.findOne({ key: "dashboard" }).lean();
    const env = getServerEnv();
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Settings</h1>
        <p className="mt-2 text-sm text-black/55">Preferences affect dashboard display and reply defaults only.</p>
        <div className="mt-6"><SettingsForm initial={{ displayName: saved?.displayName ?? env.ADMIN_DISPLAY_NAME ?? "NLarge administrator", timezone: saved?.timezone ?? "Asia/Kolkata", dateFormat: saved?.dateFormat ?? "dd MMM yyyy", emailSignature: saved?.emailSignature ?? "Best regards,\nNLarge Global", defaultReplyTemplate: saved?.defaultReplyTemplate ?? "Thank you for your message. We will review this and get back to you shortly." }} /></div>
      </div>
    );
  }
  if (section === "exports") {
    await connectToDatabase();
    const clients = await Client.find().select("_id name").sort({ name: 1 }).lean();
    return <ExportManager clients={clients.map((client) => ({ _id: String(client._id), name: client.name }))} />;
  }

  if (["inquiries", "clients", "projects", "secrets", "documents", "payments"].includes(section)) {
    await connectToDatabase();
    if (section === "inquiries") {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(100).lean();
      return <AdminRecordsPage title="Inquiries" description={page[1]} rows={inquiries.map((item) => ({ id: String(item._id), title: item.subject, detail: `${item.name} · ${item.email} · ${item.status}`, href: `/admin/inquiries/${item._id}` }))} />;
    }
    if (section === "clients") {
      const clients = await Client.find().sort({ name: 1 }).limit(100).lean();
      return <AdminRecordsPage title="Clients" description={page[1]} rows={clients.map((item) => ({ id: String(item._id), title: item.name, detail: [item.company, item.email].filter(Boolean).join(" · "), href: `/admin/clients/${item._id}` }))} />;
    }
    if (section === "projects") {
      const projects = await Project.find().sort({ createdAt: -1 }).limit(100).lean();
      return <AdminRecordsPage title="Projects" description={page[1]} rows={projects.map((item) => ({ id: String(item._id), title: item.name, detail: `Client ${item.clientId}${item.deadline ? ` · due ${item.deadline.toLocaleDateString()}` : ""}`, href: `/admin/projects/${item._id}` }))} />;
    }
    if (section === "secrets") {
      const secrets = await Secret.find().sort({ createdAt: -1 }).limit(100).lean();
      return <AdminRecordsPage title="Secrets" description={page[1]} rows={secrets.map((item) => ({ id: String(item._id), title: item.label, detail: `${item.type.replaceAll("-", " ")} · client ${item.clientId}` }))} />;
    }
    if (section === "documents") {
      const documents = await ClientDocument.find().sort({ createdAt: -1 }).limit(100).lean();
      return <AdminRecordsPage title="Documents" description={page[1]} rows={documents.map((item) => ({ id: String(item._id), title: item.filename, detail: `${item.contentType} · ${Math.ceil(item.size / 1024)} KB · client ${item.clientId}` }))} />;
    }
    const payments = await PaymentRecord.find().sort({ createdAt: -1 }).limit(100).lean();
    return <AdminRecordsPage title="Payments" description={page[1]} rows={payments.map((item) => ({ id: String(item._id), title: `${item.currency} ${item.amount.toLocaleString()}`, detail: `${item.status} · ${item.method.replaceAll("-", " ")} · client ${item.clientId}` }))} />;
  }

  return <AdminPlaceholderPage title={page[0]} description={page[1]} />;
}

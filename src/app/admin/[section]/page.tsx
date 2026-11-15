import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AuditEvent } from "@/features/admin/models/audit-event";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { getHealthChecks } from "@/features/admin/services/health";
import { Settings } from "@/features/admin/models/settings";
import { getServerEnv } from "@/lib/env";
import SettingsForm from "@/features/admin/components/SettingsForm";
import { Client } from "@/features/admin/models/client";
import ExportManager from "@/features/admin/components/ExportManager";

const sections = {
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
        <Link href="/admin/overview" className="mt-5 inline-block text-sm font-semibold text-[#602329]">Back to overview</Link>
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

  await connectToDatabase();
  const clients = await Client.find().select("_id name").sort({ name: 1 }).lean();
  return <ExportManager clients={clients.map((client) => ({ _id: String(client._id), name: client.name }))} />;
}

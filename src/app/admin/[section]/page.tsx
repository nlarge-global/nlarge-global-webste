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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/features/admin/components/Pagination";

const sections = {
  audit: [
    "Audit log",
    "Review security-relevant actions and operational history.",
  ],
  health: [
    "Health",
    "Check the status of required private services and configuration.",
  ],
  settings: [
    "Settings",
    "Manage dashboard preferences and setup instructions.",
  ],
  exports: ["Exports", "Prepare authenticated client handover packages."],
} as const;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  const { section } = await params;
  const pageNumber = Math.max(1, Number((await searchParams).page || 1));
  const page = sections[section as keyof typeof sections];
  if (!page) notFound();

  if (section === "audit") {
    await connectToDatabase();
    const pageSize = 25;
    const [events, total] = await Promise.all([
      AuditEvent.find().sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
      AuditEvent.countDocuments(),
    ]);
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Audit log
        </h1>
        <p className="mt-2 text-sm text-black/55">
          Append-only records of authenticated and public operations.
        </p>
        <Card className="mt-6 overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Resource</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
            <TableBody>
            {events.length === 0 && (
              <TableRow><TableCell colSpan={3}>No audit events yet.</TableCell></TableRow>
            )}
            {events.map((event) => (
              <TableRow key={String(event._id)}>
                <TableCell className="font-medium">{event.action}</TableCell>
                <TableCell className="text-black/55">{event.resourceType}{event.resourceId ? ` · ${event.resourceId}` : ""}</TableCell>
                <TableCell className="text-right text-xs text-black/45"><time>{event.createdAt.toLocaleString()}</time></TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </Card>
        <Pagination page={pageNumber} hasNext={pageNumber * pageSize < total} basePath="/admin/audit" />
        <Link
          href="/admin/overview"
          className="mt-5 inline-block text-sm font-semibold text-[#602329]"
        >
          Back to overview
        </Link>
      </div>
    );
  }

  if (section === "health") {
    const checks = await getHealthChecks();
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Health
        </h1>
        <p className="mt-2 text-sm text-black/55">
          Safe service summaries for the private workspace.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(checks).map(([name, check]) => (
            <Card
              key={name}
              className="p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold capitalize">{name}</h2>
                <Badge variant={check.status === "ok" ? "success" : check.status === "error" ? "destructive" : "warning"}>
                  {check.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-black/55">
                {check.message}
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (section === "settings") {
    await connectToDatabase();
    const saved = await Settings.findOne({ key: "dashboard" }).lean();
    const env = getServerEnv();
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-black/55">
          Preferences affect dashboard display and reply defaults only.
        </p>
        <div className="mt-6">
          <SettingsForm
            initial={{
              displayName:
                saved?.displayName ??
                env.ADMIN_DISPLAY_NAME ??
                "NLarge administrator",
              timezone: saved?.timezone ?? "Asia/Kolkata",
              dateFormat: saved?.dateFormat ?? "dd MMM yyyy",
              emailSignature:
                saved?.emailSignature ?? "Best regards,\nNLarge Global",
              defaultReplyTemplate:
                saved?.defaultReplyTemplate ??
                "Thank you for your message. We will review this and get back to you shortly.",
            }}
          />
        </div>
      </div>
    );
  }

  await connectToDatabase();
  const clients = await Client.find()
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return (
    <ExportManager
      clients={clients.map((client) => ({
        _id: String(client._id),
        name: client.name,
      }))}
    />
  );
}

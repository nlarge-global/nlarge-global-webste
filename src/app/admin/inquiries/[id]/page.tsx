import { notFound, redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ConversationTimeline from "@/features/admin/components/ConversationTimeline";
import ReplyComposer from "@/features/admin/components/ReplyComposer";
import { Inquiry } from "@/features/admin/models/inquiry";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { Client } from "@/features/admin/models/client";
import InquiryClientLink from "@/features/admin/components/InquiryClientLink";
import { connectToDatabase } from "@/lib/mongodb";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { id } = await params;
  await connectToDatabase();
  const inquiry = await Inquiry.findById(id).lean();
  if (!inquiry) notFound();
  const entries = await ConversationEntry.find({ inquiryId: inquiry._id }).sort({ occurredAt: -1 }).lean();
  const clients = await Client.find().select("_id name").sort({ name: 1 }).lean();

  return (
    <div>
      <Link href="/admin/inquiries" className="inline-flex items-center gap-2 text-sm font-semibold text-[#602329] hover:text-black">
        <FiArrowLeft aria-hidden="true" /> Back to inquiries
      </Link>
      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Inquiry</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{inquiry.subject}</h1>
            <p className="mt-2 text-sm text-black/55">{inquiry.name} · {inquiry.email}</p>
          </div>
          <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-semibold capitalize">{inquiry.status}</span>
        </div>
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/75">{inquiry.message}</p>
        <InquiryClientLink
          inquiryId={String(inquiry._id)}
          currentClientId={inquiry.clientId ? String(inquiry.clientId) : undefined}
          clients={clients.map((client) => ({ _id: String(client._id), name: client.name }))}
        />
      </div>
      <div className="mt-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <ConversationTimeline inquiryId={String(inquiry._id)} initialEntries={entries.map((entry) => ({
          _id: String(entry._id),
          channel: entry.channel,
          direction: entry.direction,
          content: entry.content,
          occurredAt: entry.occurredAt.toISOString(),
          }))} />
          <ReplyComposer inquiryId={String(inquiry._id)} />
        </div>
      </div>
    </div>
  );
}

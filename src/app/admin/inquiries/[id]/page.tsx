import { notFound, redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ConversationTimeline from "@/features/admin/components/ConversationTimeline";
import { Inquiry } from "@/features/admin/models/inquiry";
import { ConversationEntry } from "@/features/admin/models/conversation-entry";
import { Client } from "@/features/admin/models/client";
import InquiryClientLink from "@/features/admin/components/InquiryClientLink";
import InquiryProperties from "@/features/admin/components/InquiryProperties";
import { connectToDatabase } from "@/lib/mongodb";

const TIMELINE_PAGE_SIZE = 30;

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { id } = await params;
  await connectToDatabase();
  const inquiry = await Inquiry.findById(id).lean();
  if (!inquiry) notFound();
  const [entryPage, clients] = await Promise.all([
    ConversationEntry.find({ inquiryId: inquiry._id }).sort({ occurredAt: -1, _id: -1 }).limit(TIMELINE_PAGE_SIZE + 1).lean(),
    Client.find().select("_id name").sort({ name: 1 }).lean(),
  ]);
  const hasMoreEntries = entryPage.length > TIMELINE_PAGE_SIZE;
  const entries = entryPage.slice(0, TIMELINE_PAGE_SIZE);

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
        </div>
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/75">{inquiry.message}</p>
        <InquiryProperties
          inquiryId={String(inquiry._id)}
          initialStatus={inquiry.status}
          initialPriority={inquiry.priority}
        />
        <p className="mt-4 text-xs text-black/50">
          {inquiry.privacyAcknowledgement
            ? `Privacy notice ${inquiry.privacyAcknowledgement.version} acknowledged on ${inquiry.privacyAcknowledgement.acknowledgedAt.toLocaleString()}.`
            : inquiry.consent
              ? "Legacy public contact-form acknowledgement recorded."
              : "No public contact-form acknowledgement recorded."}
          {inquiry.marketingConsent
            ? ` Marketing consent ${inquiry.marketingConsent.version} recorded on ${inquiry.marketingConsent.grantedAt.toLocaleString()}.`
            : inquiry.origin !== "manual" && inquiry.privacyAcknowledgement
              ? " Marketing updates were not selected."
              : ""}
          {inquiry.origin === "manual" ? " · Manually entered" : ""}
        </p>
        {inquiry.privacyAcknowledgement && (
          <div className="mt-3 max-w-3xl rounded-xl bg-[#f1efea] p-4 text-sm leading-6 text-black/70">
            <blockquote>{inquiry.privacyAcknowledgement.text}</blockquote>
            <p className="mt-2">
              <Link
                href={`/privacy-policy/${encodeURIComponent(inquiry.privacyAcknowledgement.version)}`}
                className="font-semibold text-[#602329] underline underline-offset-4"
              >
                View acknowledged policy version
              </Link>
              {inquiry.privacyAcknowledgement.hash
                ? ` · SHA-256 ${inquiry.privacyAcknowledgement.hash}`
                : " · Legacy record without a document fingerprint"}
            </p>
          </div>
        )}
        {inquiry.marketingConsent && (
          <blockquote className="mt-3 max-w-3xl rounded-xl bg-[#f1efea] p-4 text-sm leading-6 text-black/70">
            {inquiry.marketingConsent.text}
          </blockquote>
        )}
        <InquiryClientLink
          inquiryId={String(inquiry._id)}
          currentClientId={inquiry.clientId ? String(inquiry.clientId) : undefined}
          clients={clients.map((client) => ({ _id: String(client._id), name: client.name }))}
        />
      </div>
      <div className="mt-6">
        <ConversationTimeline inquiryId={String(inquiry._id)} initialHasMore={hasMoreEntries} initialEntries={entries.map((entry) => ({
          _id: String(entry._id),
          channel: entry.channel,
          direction: entry.direction,
          content: entry.content,
          occurredAt: entry.occurredAt.toISOString(),
          }))} />
      </div>
    </div>
  );
}

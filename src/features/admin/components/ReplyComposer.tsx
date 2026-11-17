"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "./ui/Button";
import type { TimelineEntry } from "./ConversationTimeline";

type ReplyDefaults = {
  recipient: string;
  subject: string;
  message: string;
  signature: string;
};

export default function ReplyComposer({
  inquiryId,
  onSent,
}: {
  inquiryId: string;
  onSent: (entry: TimelineEntry) => void;
}) {
  const [defaults, setDefaults] = useState<ReplyDefaults | null>(null);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(`/api/admin/inquiries/${inquiryId}/reply`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as ReplyDefaults & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load reply defaults.");
        setDefaults(result);
        setSubject(result.subject);
        setMessage(result.message);
        setSignature(result.signature);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(getDisplayErrorMessage(cause, "Unable to load reply defaults."));
      });
    return () => controller.abort();
  }, [inquiryId, loadAttempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({ subject, message, signature }),
      });
      const result = await response.json() as { error?: string; entry?: TimelineEntry };
      if (!response.ok || !result.entry) {
        setError(result.error ?? "Unable to send reply.");
        return;
      }
      onSent(result.entry);
    } catch (error) {
      setError(getDisplayErrorMessage(error, "Unable to send reply. Check your connection and try again."));
    } finally {
      setPending(false);
    }
  }

  if (!defaults && !error) {
    return (
      <div role="status" aria-label="Loading reply defaults" className="space-y-4">
        <span className="sr-only">Loading communication defaults</span>
        <div className="h-4 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="h-11 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
        <div className="h-32 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!defaults && error && (
        <Button type="button" variant="outline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
          Retry loading defaults
        </Button>
      )}
      {defaults && (
        <>
          <p className="rounded-xl bg-[#f5f3f0] p-3 text-sm text-black/65">
            To <span className="font-medium text-black">{defaults.recipient}</span>
          </p>
          <label className="block text-sm font-medium">Subject
            <input name="subject" required maxLength={150} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
          </label>
          <label className="block text-sm font-medium">Message
            <textarea name="message" required maxLength={5000} rows={7} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
          </label>
          <label className="block text-sm font-medium">Signature
            <textarea name="signature" required maxLength={500} rows={3} value={signature} onChange={(event) => setSignature(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
          </label>
          <div className="rounded-xl border border-black/10 bg-[#f5f3f0] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/55">Reply preview</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/75">{message || "Your message preview will appear here."}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/75">{signature}</p>
          </div>
        </>
      )}
      <Button type="submit" disabled={pending || !defaults} className="w-full">{pending ? "Sending…" : "Send reply"}</Button>
    </form>
  );
}

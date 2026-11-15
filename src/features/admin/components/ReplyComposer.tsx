"use client";

import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";

export default function ReplyComposer({ inquiryId }: { inquiryId: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setStatus("");
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/inquiries/${inquiryId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
      },
      body: JSON.stringify({
        subject: form.get("subject"),
        message: form.get("message"),
        signature: form.get("signature"),
      }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to send reply.");
    else {
      setStatus("Reply sent and added to the timeline.");
      setMessage("");
      event.currentTarget.reset();
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Reply by email</h2>
          <p className="mt-1 text-sm text-black/50">The recipient is taken from the inquiry.</p>
        </div>
        <span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-semibold">SMTP</span>
      </div>
      <label className="mt-5 block text-sm font-medium">Subject
        <input name="subject" required maxLength={150} defaultValue="Re: Your NLarge Global inquiry" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" />
      </label>
      <label className="mt-4 block text-sm font-medium">Message
        <textarea name="message" required maxLength={5000} rows={7} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
      </label>
      <label className="mt-4 block text-sm font-medium">Signature
        <textarea name="signature" required maxLength={500} defaultValue={"Best regards,\nNLarge Global"} rows={3} className="mt-2 w-full rounded-xl border border-black/15 p-3" />
      </label>
      <div className="mt-4 rounded-xl border border-black/10 bg-[#f5f3f0] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45">Safe preview</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/70">{message || "Your message preview will appear here."}</p>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
      {status && <p role="status" className="mt-3 text-sm text-emerald-700">{status}</p>}
      <Button type="submit" disabled={pending} className="mt-5 w-full">
        {pending ? "Sending..." : "Send reply"}
      </Button>
    </form>
  );
}

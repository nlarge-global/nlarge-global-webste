"use client";

import { useState, type FormEvent } from "react";
import { getDisplayErrorMessage } from "@/lib/error-message";

export default function UnsubscribeRequestForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("idle");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/unsubscribe/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send the link.");
      setStatus("sent");
    } catch (error) {
      console.error("Unsubscribe link request failed:", error);
      setErrorMessage(
        getDisplayErrorMessage(
          error,
          "We could not send the link. Please try again or contact support.",
        ),
      );
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={requestLink} className="mt-7 max-w-xl">
      <label htmlFor="unsubscribe-email" className="block text-sm font-semibold">
        Email address
      </label>
      <input
        id="unsubscribe-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        className="mt-2 min-h-12 w-full rounded-lg border border-black/20 bg-white px-4 text-base outline-none transition-colors focus:border-[#602329] focus:ring-2 focus:ring-[#602329]/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 rounded-full bg-[#602329] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#481a1e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me an unsubscribe link"}
      </button>
      {status === "sent" && (
        <p role="status" className="mt-4 text-sm leading-6 text-black/70">
          If the address is subscribed, an email with instructions will arrive shortly.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-4 text-sm leading-6 text-[#602329]">
          {errorMessage || "We could not send the link. Please try again or contact support."}
        </p>
      )}
    </form>
  );
}

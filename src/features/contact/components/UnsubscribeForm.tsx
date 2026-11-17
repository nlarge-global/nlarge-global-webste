"use client";

import { useState } from "react";
import { getDisplayErrorMessage } from "@/lib/error-message";

export default function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function unsubscribe() {
    setPending(true);
    setStatus("idle");
    setErrorMessage("");
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to unsubscribe.");
      setStatus("done");
    } catch (error) {
      console.error("Unsubscribe form error:", error);
      setErrorMessage(
        getDisplayErrorMessage(error, "We could not update your subscription. Please try again."),
      );
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending || status === "done"}
        onClick={unsubscribe}
        className="min-h-12 rounded-full bg-[#602329] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#481a1e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329] disabled:opacity-60"
      >
        {pending ? "Updating…" : status === "done" ? "Unsubscribed" : "Unsubscribe"}
      </button>
      {status === "done" && (
        <p role="status" className="mt-4 text-sm text-black/70">
          This email address is unsubscribed from marketing updates.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-[#602329]">
          {errorMessage || "We could not update your subscription. Please try again."}
        </p>
      )}
    </div>
  );
}

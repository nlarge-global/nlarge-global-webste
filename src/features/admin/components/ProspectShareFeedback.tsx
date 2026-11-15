"use client";

import { useState } from "react";
import { FiCheckCircle, FiInfo, FiXCircle, FiX } from "react-icons/fi";

export default function ProspectShareFeedback({ result }: { result?: string }) {
  const [visible, setVisible] = useState(Boolean(result));
  if (!result || !visible) return null;

  const message = result === "created"
    ? "Shared link saved as a prospect. It’s ready for review."
    : result === "signin"
      ? "Sign in first, then share the link again from your phone."
      : "We couldn’t save that link. Share an http or https URL while signed in.";
  const Icon = result === "created" ? FiCheckCircle : result === "signin" ? FiInfo : FiXCircle;

  return (
    <div role={result === "error" ? "alert" : "status"} className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-[#602329]/20 bg-[#f7efed] p-4 text-sm text-[#602329]">
      <p className="flex items-start gap-2"><Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{message}</p>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss message" className="rounded p-1 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]">
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}

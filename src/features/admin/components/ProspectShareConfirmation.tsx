"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiExternalLink, FiShare2 } from "react-icons/fi";
import type { PendingAdminShare } from "@/features/admin/auth/session";
import { Button } from "./ui/Button";

export default function ProspectShareConfirmation({
  pendingShare,
}: {
  pendingShare: PendingAdminShare;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function saveSharedProspect() {
    setPending(true);
    setError("");

    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch("/api/admin/prospects/share/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({ shareId: pendingShare.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to save the shared link.");
        return;
      }
      router.replace("/admin/prospects?share=created");
    } catch (saveError) {
      setError(
        process.env.NODE_ENV === "development" && saveError instanceof Error
          ? saveError.message
          : "Unable to save the shared link.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="share-confirmation-heading"
      className="mt-5 rounded-2xl border border-[#602329]/20 bg-[#f7efed] p-5"
    >
      <div className="flex items-start gap-3">
        <FiShare2 aria-hidden="true" className="mt-1 size-5 shrink-0 text-[#602329]" />
        <div className="min-w-0 flex-1">
          <h2 id="share-confirmation-heading" className="font-semibold">
            Review shared link
          </h2>
          <p className="mt-1 text-sm text-black/65">
            Confirm this link to add it to your prospect list.
          </p>
          {pendingShare.name && (
            <p className="mt-3 break-words text-sm font-medium">{pendingShare.name}</p>
          )}
          <a
            href={pendingShare.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-sm font-medium text-[#602329] underline underline-offset-2"
          >
            {pendingShare.url}
            <FiExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
          {pendingShare.notes && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-black/65">
              {pendingShare.notes}
            </p>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
          <Button
            type="button"
            onClick={saveSharedProspect}
            disabled={pending}
            className="mt-4"
          >
            {pending ? "Saving..." : "Save as prospect"}
          </Button>
        </div>
      </div>
    </section>
  );
}

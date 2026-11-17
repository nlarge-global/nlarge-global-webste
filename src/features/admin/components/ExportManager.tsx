"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { useState, type FormEvent } from "react";
import {
  FiAlertCircle,
  FiDownload,
  FiFileText,
  FiFolder,
  FiKey,
  FiMessageSquare,
  FiShield,
} from "react-icons/fi";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";

export default function ExportManager({
  clients,
}: {
  clients: Array<{ _id: string; name: string }>;
}) {
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [unavailableDocumentCount, setUnavailableDocumentCount] = useState(0);

  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCreating(true);
    setError("");
    setUnavailableDocumentCount(0);

    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch("/api/admin/exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          includeDocuments: form.get("includeDocuments") === "on",
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to download export.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "client-export.zip";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      setUnavailableDocumentCount(
        Number(response.headers.get("X-Export-Unavailable-Documents") ?? "0"),
      );
    } catch (reason) {
      setError(getDisplayErrorMessage(reason, "Unable to download export."));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
      <form
        onSubmit={download}
        aria-busy={creating}
        className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Prepare an export</h2>
          <p className="mt-1 text-sm leading-6 text-black/55">
            Choose a client and decide whether to include their permitted files.
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium">
          Client
          <Select name="clientId" required disabled={creating || clients.length === 0}>
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-4 text-sm transition-colors hover:bg-[#faf8f6]">
          <input
            name="includeDocuments"
            type="checkbox"
            disabled={creating}
            className="mt-0.5 size-4 shrink-0 accent-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
          />
          <span>
            <span className="block font-medium text-black/80">
              Include permitted client documents
            </span>
            <span className="mt-1 block leading-5 text-black/55">
              Adds the private files themselves to the archive, not just their metadata.
            </span>
          </span>
        </label>

        {creating && (
          <div className="mt-5" role="status" aria-live="polite">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[#602329]">Building secure archive…</span>
              <span className="text-black/50">This may take a moment</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[#602329]/10"
              role="progressbar"
              aria-label="Creating client export"
              aria-valuetext="Export creation in progress"
            >
              <div className="h-full w-1/3 animate-[export-progress_1.4s_ease-in-out_infinite] rounded-full bg-[#602329] motion-reduce:animate-none motion-reduce:translate-x-full" />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-800">
            <FiAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row">
          <Button
            type="submit"
            disabled={creating || clients.length === 0}
            className="w-full sm:flex-1"
          >
            <FiDownload aria-hidden="true" />
            {creating ? "Preparing download…" : "Download export"}
          </Button>
        </div>
        {clients.length === 0 && (
          <p className="mt-3 text-sm text-black/55">
            Add a client before creating an export.
          </p>
        )}
        {unavailableDocumentCount > 0 && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">
              {unavailableDocumentCount} document
              {unavailableDocumentCount === 1 ? " file is" : " files are"} missing from storage.
            </p>
            <p className="mt-1 leading-5">
              The archive includes a <code>documents-unavailable.json</code> manifest
              listing them. Check the original uploads before sharing this export.
            </p>
          </div>
        )}
      </form>

      <aside className="rounded-2xl border border-black/10 bg-[#f7f4f1] p-5 sm:p-6">
        <h2 className="text-base font-semibold">What’s in the archive</h2>
        <p className="mt-1 text-sm leading-6 text-black/55">
          The export is prepared for client handover and excludes credentials.
        </p>
        <ul className="mt-5 space-y-3">
          <ContentsItem icon={<FiFolder aria-hidden="true" />}>Client and project records</ContentsItem>
          <ContentsItem icon={<FiFileText aria-hidden="true" />}>Tasks, payments, and document details</ContentsItem>
          <ContentsItem icon={<FiMessageSquare aria-hidden="true" />}>Inquiries and conversation history</ContentsItem>
          <ContentsItem icon={<FiKey aria-hidden="true" />}>Secrets are never included</ContentsItem>
        </ul>
        <div className="mt-6 flex items-start gap-3 border-t border-black/10 pt-5">
          <FiShield aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#602329]" />
          <p className="text-xs leading-5 text-black/60">
            Exports require an authenticated admin session and are downloaded directly.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ContentsItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 text-sm text-black/75">
      <span className="mt-0.5 text-[#602329]">{icon}</span>
      {children}
    </li>
  );
}

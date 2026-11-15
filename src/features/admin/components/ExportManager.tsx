"use client";

import { useState, type FormEvent } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiDownload,
  FiFileText,
  FiFolder,
  FiKey,
  FiMessageSquare,
  FiShield,
} from "react-icons/fi";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";

type ExportResult = {
  downloadUrl: string;
  expiresAt?: string;
  unavailableDocuments: string[];
};

export default function ExportManager({
  clients,
}: {
  clients: Array<{ _id: string; name: string }>;
}) {
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCreating(true);
    setExportResult(null);
    setError("");

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
      const result = (await response.json()) as {
        downloadUrl?: string;
        expiresAt?: string;
        unavailableDocuments?: string[];
        error?: string;
      };
      if (!response.ok || !result.downloadUrl) {
        throw new Error(result.error ?? "Unable to create export.");
      }
      setExportResult({
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt,
        unavailableDocuments: result.unavailableDocuments ?? [],
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to create export.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function download() {
    if (!exportResult) return;
    setDownloading(true);
    setError("");
    try {
      const response = await fetch(exportResult.downloadUrl);
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Export expired or could not be downloaded.");
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Export expired or could not be downloaded.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
      <form
        onSubmit={create}
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
            {creating ? "Creating export…" : "Create export"}
          </Button>
          {exportResult && (
            <Button
              type="button"
              variant="outline"
              disabled={downloading}
              onClick={() => void download()}
              className="w-full sm:flex-1"
            >
              <FiDownload aria-hidden="true" />
              {downloading ? "Preparing download…" : "Download export"}
            </Button>
          )}
        </div>
        {clients.length === 0 && (
          <p className="mt-3 text-sm text-black/55">
            Add a client before creating an export.
          </p>
        )}
        {exportResult && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <FiCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Export is ready</p>
              <p className="mt-1 leading-5">
                The secure download link expires after 10 minutes.
                {exportResult.expiresAt && (
                  <> Expires at {new Date(exportResult.expiresAt).toLocaleTimeString()}.</>
                )}
              </p>
            </div>
          </div>
        )}
        {exportResult && exportResult.unavailableDocuments.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">
              Export created, but {exportResult.unavailableDocuments.length} document
              {exportResult.unavailableDocuments.length === 1 ? " file is" : " files are"} missing from storage.
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
            Download links require an authenticated admin session and are short-lived.
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

"use client";

import { getDisplayErrorMessage } from "@/lib/error-message";
import { useState, type FormEvent } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCopy,
  FiDownload,
  FiFileText,
  FiFolder,
  FiKey,
  FiMessageSquare,
  FiShield,
} from "react-icons/fi";
import type { ExportType } from "@/features/admin/services/export-archive";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";

type ExportResult = {
  filename: string;
  password: string;
};

const exportOptions: Array<{ value: ExportType; label: string }> = [
  { value: "client", label: "Client handover" },
  { value: "prospects", label: "Prospects and activity" },
  { value: "subscribers", label: "Subscribed contacts" },
  { value: "inquiries", label: "Inquiries and conversations" },
  { value: "audit", label: "Audit log" },
  { value: "operations", label: "Operations log" },
];

function dateInput(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function ExportManager({
  clients,
}: {
  clients: Array<{ _id: string; name: string; archived: boolean }>;
}) {
  const [exportType, setExportType] = useState<ExportType>("client");
  const [from, setFrom] = useState(() => dateInput(29));
  const [to, setTo] = useState(() => dateInput(0));
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);

  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCreating(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const body = {
        exportType,
        ...(exportType === "client" ? {
          clientId: String(form.get("clientId") ?? ""),
          includeDocuments: form.get("includeDocuments") === "on",
        } : {}),
        ...(exportType === "audit" || exportType === "operations"
          ? { from, to }
          : {}),
      };
      const response = await fetch("/api/admin/exports", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your admin session has expired. Sign in again, then retry the export.");
        }
        const responseBody = await response.json() as { error?: string };
        throw new Error(responseBody.error ?? "Unable to download export.");
      }

      const password = response.headers.get("X-Export-Password");
      if (!password) throw new Error("The export completed without a password. Please retry.");
      const blob = await response.blob();
      if (!blob.size) throw new Error("The downloaded export is empty. Please retry.");

      const filename = /filename="([^"]+)"/.exec(
        response.headers.get("Content-Disposition") ?? "",
      )?.[1] ?? "nlarge-export.zip";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setResult({ filename, password });
    } catch (reason) {
      setError(getDisplayErrorMessage(reason, "Unable to download export."));
    } finally {
      setCreating(false);
    }
  }

  async function copyPassword() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the password. Select and copy it manually.");
    }
  }

  const isClientExport = exportType === "client";
  const isLogExport = exportType === "audit" || exportType === "operations";
  const canExport = !isClientExport || clients.length > 0;

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
            Choose the records to export. Every archive is protected with a fresh AES-256 password.
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium">
          Data to export
          <Select
            name="exportType"
            value={exportType}
            disabled={creating}
            onChange={(event) => {
              setExportType(event.target.value as ExportType);
              setError("");
              setResult(null);
            }}
          >
            {exportOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>

        {isClientExport && (
          <>
            <label className="mt-4 block text-sm font-medium">
              Client
              <Select name="clientId" required disabled={creating || clients.length === 0}>
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}{client.archived ? " · archived" : ""}
                  </option>
                ))}
              </Select>
            </label>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-4 text-sm transition-colors hover:bg-[#faf8f6]">
              <input
                name="includeDocuments"
                type="checkbox"
                disabled={creating}
                className="mt-0.5 size-4 shrink-0 accent-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
              />
              <span>
                <span className="block font-medium text-black/80">
                  Include the private document files
                </span>
                <span className="mt-1 block leading-5 text-black/55">
                  Document metadata is included either way; credentials are never exported.
                </span>
              </span>
            </label>
          </>
        )}

        {isLogExport && (
          <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-medium">Log date range</legend>
            <label className="text-sm font-medium">
              From
              <input
                type="date"
                name="from"
                required
                disabled={creating}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
              />
            </label>
            <label className="text-sm font-medium">
              Through
              <input
                type="date"
                name="to"
                required
                disabled={creating}
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
              />
            </label>
            <p className="text-xs leading-5 text-black/55 sm:col-span-2">
              {exportType === "operations"
                ? "Operational logs are retained for 90 days; each export is limited to 90 days."
                : "Audit exports are limited to a 365-day window."}
            </p>
          </fieldset>
        )}

        {creating && (
          <div className="mt-5" role="status" aria-live="polite">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[#602329]">Preparing encrypted archive…</span>
              <span className="text-black/50">Large exports may take a moment</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[#602329]/10"
              role="progressbar"
              aria-label="Creating export"
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

        {result && (
          <section aria-label="Export download password" role="status" className="mt-5 rounded-xl border border-[#602329]/20 bg-[#602329]/5 p-4">
            <p className="font-semibold text-[#602329]">Export downloaded · password shown once</p>
            <p className="mt-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-black">
              {result.password}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" variant="outline" onClick={() => void copyPassword()}>
                {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                {copied ? "Copied" : "Copy password"}
              </Button>
              <span className="break-all text-xs text-black/55">{result.filename}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-black/60">
              Save or share the password separately. It is not stored; if you lose it, create a new export.
            </p>
          </section>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row">
          <Button
            type="submit"
            disabled={creating || !canExport}
            className="w-full sm:flex-1"
          >
            <FiDownload aria-hidden="true" />
            {creating ? "Preparing download…" : "Create encrypted export"}
          </Button>
        </div>
        {!canExport && (
          <p className="mt-3 text-sm text-black/55">
            Add or restore a client before creating a client export.
          </p>
        )}
      </form>

      <aside className="rounded-2xl border border-black/10 bg-[#f7f4f1] p-5 sm:p-6">
        <h2 className="text-base font-semibold">Included data</h2>
        <p className="mt-1 text-sm leading-6 text-black/55">
          {exportType === "client"
            ? "Client handover includes linked records and excludes all secret values."
            : exportType === "prospects"
              ? "Prospects include their follow-up details and activity history."
              : exportType === "subscribers"
                ? "Only subscribed addresses and their consent evidence are exported."
                : exportType === "inquiries"
                  ? "Inquiry records include consent evidence and conversations."
                  : exportType === "audit"
                    ? "Audit events include safe metadata for the selected date range."
                    : "Operational events include technical and request context for the selected date range."}
        </p>
        <ul className="mt-5 space-y-3">
          <ContentsItem icon={<FiFolder aria-hidden="true" />}>
            {isClientExport ? "Client profile, projects, tasks, and payments" : "JSON data streamed into the archive"}
          </ContentsItem>
          <ContentsItem icon={<FiMessageSquare aria-hidden="true" />}>
            {isClientExport ? "Linked inquiries and conversation history" : "Only the selected data category"}
          </ContentsItem>
          <ContentsItem icon={<FiKey aria-hidden="true" />}>
            AES-256 encryption; a new password for each export
          </ContentsItem>
          {isClientExport && (
            <ContentsItem icon={<FiFileText aria-hidden="true" />}>
              Document metadata, plus files only when selected
            </ContentsItem>
          )}
        </ul>
        <div className="mt-6 flex items-start gap-3 border-t border-black/10 pt-5">
          <FiShield aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#602329]" />
          <p className="text-xs leading-5 text-black/60">
            Export contents are encrypted; ZIP entry names and other archive metadata remain visible. Recipients need a current AES-compatible tool such as 7-Zip or WinZip.
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

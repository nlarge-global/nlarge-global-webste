"use client";

import { useId } from "react";
import { FiX } from "react-icons/fi";
import { formatDateTime } from "@/features/admin/services/date-time";
import { formatFileSize } from "@/features/admin/services/document-upload-config";
import type { DocumentRecord } from "./DocumentManager";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";

export default function DocumentDetailsDialog({
  document,
  loading,
  onOpenFile,
  onClose,
}: {
  document: DocumentRecord;
  loading: boolean;
  onOpenFile: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useDialogEscape(true, onClose);

  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-busy={loading}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold">
              Document details
            </h2>
            <p className="mt-1 break-all text-sm text-black/60">
              {document.filename}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close document details"
            title="Close document details"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </Button>
        </header>
        {loading ? (
          <div className="mt-5 space-y-3" role="status">
            <span className="sr-only">Loading document details</span>
            <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-20 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          </div>
        ) : (
          <dl className="mt-5 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-2">
            <Detail label="Type" value={document.contentType} />
            <Detail
              label="Size"
              value={document.size ? formatFileSize(document.size) : undefined}
            />
            <Detail label="Tags" value={document.tags?.join(", ")} />
            <Detail
              label="Created"
              value={formatDateTime(document.createdAt)}
            />
            <Detail
              label="Last updated"
              value={
                document.updatedAt
                  ? formatDateTime(document.updatedAt)
                  : undefined
              }
            />
            <Detail
              label="Description"
              value={document.description}
              className="sm:col-span-2"
            />
          </dl>
        )}
        <p className="mt-5 border-t border-black/10 pt-4 text-xs leading-5 text-black/55">
          Stored encrypted on the server. Open the file to view its contents.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={loading}
          onClick={onOpenFile}
        >
          Open file
        </Button>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-black/50">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-black/80">
        {value?.trim() || (
          <span className="text-black/45">Not provided</span>
        )}
      </dd>
    </div>
  );
}

"use client";

import { useId } from "react";
import { FiX } from "react-icons/fi";
import { formatDateTime } from "@/features/admin/services/date-time";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";

type SecretDetails = {
  label: string;
  type: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function SecretDetailsDialog({
  secret,
  loading,
  onClose,
}: {
  secret: SecretDetails;
  loading: boolean;
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
        className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">
              Secret details
            </h2>
            <p className="mt-1 break-words text-sm text-black/60">
              {secret.label}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close secret details"
            title="Close secret details"
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </Button>
        </header>
        {loading ? (
          <div className="mt-5 space-y-3" role="status">
            <span className="sr-only">Loading secret details</span>
            <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          </div>
        ) : (
          <dl className="mt-5 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-2">
            <SecretDetail
              label="Type"
              value={secret.type.replaceAll("-", " ")}
            />
            <SecretDetail
              label="Expires at"
              value={
                secret.expiresAt ? formatDateTime(secret.expiresAt) : undefined
              }
            />
            <SecretDetail
              label="Created"
              value={
                secret.createdAt ? formatDateTime(secret.createdAt) : undefined
              }
            />
            <SecretDetail
              label="Last updated"
              value={
                secret.updatedAt ? formatDateTime(secret.updatedAt) : undefined
              }
            />
          </dl>
        )}
        <p className="mt-4 text-xs leading-5 text-black/55">
          The encrypted value is never shown in details. Use Reveal to access it
          after re-authentication.
        </p>
      </section>
    </div>
  );
}

function SecretDetail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-black/50">
        {label}
      </dt>
      <dd className="mt-1 capitalize text-sm text-black/80">
        {value ?? <span className="text-black/45">Not provided</span>}
      </dd>
    </div>
  );
}

"use client";

import { FiX } from "react-icons/fi";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";
import RecordBadge from "./RecordBadge";
import { formatCurrency } from "@/features/admin/services/currency";

type Payment = {
  _id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  utrReference?: string;
  paidAt?: string | null;
  notes?: string;
  proofDocumentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function PaymentDetailsDialog({
  payment,
  loading = false,
  onClose,
}: {
  payment: Payment;
  loading?: boolean;
  onClose: () => void;
}) {
  const dialogRef = useDialogEscape(true, onClose);

  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`payment-details-${payment._id}`}
      aria-busy={loading}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={`payment-details-${payment._id}`}
              className="text-xl font-semibold"
            >
              Payment details
            </h2>
            <p className="mt-1 text-sm capitalize text-black/55">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
            <RecordBadge status={payment.status} className="mt-2" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close payment details"
            title="Close payment details"
            autoFocus
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </Button>
        </header>
        {loading ? (
          <div className="mt-5 space-y-3" role="status">
            <span className="sr-only">Loading payment details</span>
            <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-16 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          </div>
        ) : <dl className="mt-5 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-2">
          <PaymentDetail label="Method" value={payment.method.replaceAll("-", " ")} />
          <PaymentDetail
            label="Payment date"
            value={formatTimestamp(payment.paidAt)}
          />
          <PaymentDetail label="UTR/reference" value={payment.utrReference} />
          <PaymentDetail
            label="Proof document"
            value={payment.proofDocumentId ? String(payment.proofDocumentId) : undefined}
          />
          <PaymentDetail
            label="Created"
            value={formatTimestamp(payment.createdAt)}
          />
          <PaymentDetail
            label="Last updated"
            value={formatTimestamp(payment.updatedAt)}
          />
          <PaymentDetail
            label="Notes"
            value={payment.notes}
            className="sm:col-span-2"
          />
        </dl>}
      </section>
    </div>
  );
}

function formatTimestamp(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function PaymentDetail({
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
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-black/80">
        {value?.trim() || <span className="text-black/45">Not provided</span>}
      </dd>
    </div>
  );
}

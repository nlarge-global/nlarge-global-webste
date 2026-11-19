"use client";

import { useState, type FormEvent } from "react";
import { fromDateTimeLocal, toDateTimeLocal } from "@/features/admin/services/date-time";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";

export type PaymentFormRecord = {
  amount: number;
  currency: string;
  method: string;
  status: string;
  projectId?: string;
  paidAt?: string | null;
  proofDocumentId?: string | null;
  utrReference?: string;
  notes?: string;
};

export type PaymentFormValues = {
  amount: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  method: "bank-transfer" | "card" | "cash" | "other";
  status: "pending" | "paid" | "partial" | "overdue" | "cancelled";
  paidAt: string | null;
  proofDocumentId: string | null;
  utrReference: string;
  notes: string;
};

export default function PaymentForm({
  payment,
  title,
  titleId,
  onSubmit,
  onCancel,
  onSuccess,
  onOptimisticClose,
  onRecovery,
  onPendingChange,
  clientId,
  projectId,
}: {
  payment?: PaymentFormRecord;
  clientId: string;
  projectId?: string;
  title: string;
  titleId: string;
  onSubmit: (values: PaymentFormValues) => Promise<string | null>;
  onCancel: () => void;
  onSuccess: () => void;
  onOptimisticClose: () => void;
  onRecovery: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [documents, setDocuments] = useState<
    { _id: string; filename: string }[]
  >([]);
  const [proofDocumentId, setProofDocumentId] = useState(
    payment?.proofDocumentId ?? "",
  );

  async function loadDocuments() {
    setDocumentsLoading(true);
    setDocumentError("");
    try {
      const search = new URLSearchParams({
        ...(projectId ? { projectId } : {}),
        referencesOnly: "true",
        page: "1",
        limit: "50",
      });
      const response = await fetch(
        `/api/admin/clients/${clientId}/documents?${search}`,
      );
      const result = (await response.json()) as {
        documents?: { _id: string; filename: string }[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? "Unable to load project documents.");
      setDocuments(result.documents ?? []);
      setDocumentsLoaded(true);
    } catch (reason) {
      setDocumentError(
        reason instanceof Error
          ? reason.message
          : "Unable to load project documents.",
      );
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    onPendingChange?.(true);
    setError("");
    onOptimisticClose();
    try {
      const errorMessage = await onSubmit({
        amount: Number(form.get("amount")),
        currency: String(form.get("currency")) as PaymentFormValues["currency"],
        method: String(form.get("method")) as PaymentFormValues["method"],
        status: String(form.get("status")) as PaymentFormValues["status"],
        paidAt: fromDateTimeLocal(form.get("paidAt")),
        proofDocumentId: proofDocumentId || null,
        utrReference: String(form.get("utrReference") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim(),
      });
      if (errorMessage) {
        showOptimisticRecoveryToast(errorMessage, onRecovery);
      }
      else onSuccess();
    } finally {
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
    >
      <h2 id={titleId} className="text-xl font-semibold">
        {title}
      </h2>
      <label className="block text-sm font-medium">
        Amount
        <input
          name="amount"
          type="number"
          min="0.01"
          max="1000000000"
          step="0.01"
          required
          defaultValue={payment?.amount}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Currency
        <Select name="currency" defaultValue={payment?.currency ?? "INR"} className="mt-2">
          <option>INR</option>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
        </Select>
      </label>
      <label className="block text-sm font-medium">
        Method
        <Select
          name="method"
          defaultValue={payment?.method ?? "bank-transfer"}
          className="mt-2"
        >
          <option value="bank-transfer">Bank transfer</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </Select>
      </label>
      <label className="block text-sm font-medium">
        Status
        <Select name="status" defaultValue={payment?.status ?? "pending"} className="mt-2">
          <option>pending</option>
          <option>paid</option>
          <option>partial</option>
          <option>overdue</option>
          <option>cancelled</option>
        </Select>
      </label>
      <label className="block text-sm font-medium">
        Payment date or expected date and time
        <input
          name="paidAt"
          type="datetime-local"
          step="60"
          defaultValue={toDateTimeLocal(payment?.paidAt)}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <div>
        <span className="block text-sm font-medium">Proof document</span>
        <p className="mt-1 text-xs leading-5 text-black/55">
          Optionally link a document already stored for this project.
        </p>
        {!documentsLoaded ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            disabled={documentsLoading}
            onClick={() => void loadDocuments()}
          >
            {documentsLoading ? "Loading documents..." : "Fetch project documents"}
          </Button>
        ) : (
          <select
            aria-label="Proof document"
            value={proofDocumentId}
            onChange={(event) => setProofDocumentId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"
          >
            <option value="">No document selected</option>
            {proofDocumentId &&
              !documents.some((document) => document._id === proofDocumentId) && (
                <option value={proofDocumentId}>
                  Existing document · {proofDocumentId}
                </option>
              )}
            {documents.map((document) => (
              <option key={document._id} value={document._id}>
                {document.filename} · {document._id}
              </option>
            ))}
          </select>
        )}
        {documentsLoaded && documents.length === 0 && (
          <p className="mt-2 text-sm text-black/55">
            No project documents are available.
          </p>
        )}
        {documentError && (
          <p role="alert" className="mt-2 text-sm text-[#602329]">
            {documentError}
          </p>
        )}
      </div>
      <label className="block text-sm font-medium">
        UTR/reference
        <input
          name="utrReference"
          maxLength={150}
          defaultValue={payment?.utrReference ?? ""}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Notes
        <textarea
          name="notes"
          maxLength={3000}
          rows={3}
          defaultValue={payment?.notes ?? ""}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-[#602329]">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : payment ? "Save changes" : "Add payment"}
        </Button>
      </div>
    </form>
  );
}

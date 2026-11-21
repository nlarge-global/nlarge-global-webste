"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDisplayErrorMessage } from "@/lib/error-message";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import RecordActionsMenu from "./RecordActionsMenu";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";
import PaymentForm, {
  type PaymentFormValues,
} from "./PaymentForm";
import RecordBadge from "./RecordBadge";
import { formatCurrency } from "@/features/admin/services/currency";
import {
  deleteAdminRecord,
  restoreAdminRecord,
  type DeleteMode,
} from "./admin-delete";
import AdminListFilters from "./AdminListFilters";
import { useSearchParams } from "next/navigation";

type Payment = {
  _id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  projectId?: string;
  utrReference?: string;
  paidAt?: string | null;
  notes?: string;
  proofDocumentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
type PaymentAction = "edit" | "details" | "delete" | null;
const pageSize = 10;

const PaymentDetailsDialog = dynamic(() => import("./PaymentDetailsDialog"), {
  ssr: false,
});

export default function PaymentManager({
  clientId,
  projectId,
}: {
  clientId: string;
  projectId?: string;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [action, setAction] = useState<PaymentAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const searchParams = useSearchParams();
  const archive =
    searchParams.get("archive") === "archived" || searchParams.get("archive") === "all"
      ? searchParams.get("archive")!
      : "active";
  const router = useRouter();

  async function load(requestedPage = page) {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/payments?${new URLSearchParams({
          ...(projectId ? { projectId } : {}),
          page: String(requestedPage),
          limit: String(pageSize),
          archive,
        })}`,
      );
      const result = (await response.json()) as {
        payments?: Payment[];
        pagination?: { total: number };
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to load payments.");
      setPayments(result.payments ?? []);
      setTotal(result.pagination?.total ?? 0);
    } catch (reason) {
      setError(getDisplayErrorMessage(reason, "Unable to load payments."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [clientId, projectId, page, archive]);

  async function create(values: PaymentFormValues) {
    const temporaryId = `optimistic-${crypto.randomUUID()}`;
    const optimisticPayment: Payment = {
      _id: temporaryId,
      ...values,
      projectId,
    };
    setPayments((current) =>
      [...current, optimisticPayment].sort(
        (a, b) =>
          new Date(a.paidAt ?? 0).getTime() -
          new Date(b.paidAt ?? 0).getTime(),
      ),
    );
    setTotal((current) => current + 1);
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch(`/api/admin/clients/${clientId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
        body: JSON.stringify({ ...values, projectId }),
      });
      const result = (await response.json()) as {
        error?: string;
        payment?: Payment;
      };
      if (!response.ok || !result.payment)
        throw new Error(result.error ?? "Unable to add payment.");
      setPayments((current) =>
        current.map((payment) =>
          payment._id === temporaryId ? result.payment! : payment,
        ),
      );
      setPage(1);
      toast.success("Payment added.");
      setError("");
      if (page === 1) await load(1);
      router.refresh();
      return null;
    } catch (reason) {
      setPayments((current) =>
        current.filter((payment) => payment._id !== temporaryId),
      );
      setTotal((current) => Math.max(0, current - 1));
      const message = getDisplayErrorMessage(reason, "Unable to add payment.");
      return message;
    }
  }

  async function remove(paymentId: string, mode: DeleteMode) {
    const previousPayments = payments;
    const index = payments.findIndex((payment) => payment._id === paymentId);
    setPayments((current) =>
      current.filter((payment) => payment._id !== paymentId),
    );
    setTotal((current) => Math.max(0, current - 1));
    try {
      await deleteAdminRecord(
        `/api/admin/clients/${clientId}/payments/${paymentId}`,
        paymentId,
        mode,
        "Unable to delete payment.",
      );
      const nextTotal = Math.max(0, total - 1);
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)));
      setTotal(nextTotal);
      if (nextPage !== page) setPage(nextPage);
      toast.success(mode === "permanent" ? "Payment permanently deleted." : "Payment archived.");
      if (nextPage === page) await load(nextPage);
      router.refresh();
    } catch (reason) {
      setPayments((current) => {
        const restored = [...current];
        const previous = previousPayments[index];
        if (previous) restored.splice(Math.max(0, index), 0, previous);
        return restored;
      });
      setTotal((current) => current + 1);
      const message = getDisplayErrorMessage(reason, "Unable to delete payment.");
      setError(message);
      throw new Error(message);
    }
  }

  async function restore(payment: Payment) {
    try {
      await restoreAdminRecord(
        `/api/admin/clients/${clientId}/payments/${payment._id}`,
        payment._id,
        "Unable to restore payment.",
      );
      if (archive === "archived") {
        setPayments((current) =>
          current.filter((item) => item._id !== payment._id),
        );
        const nextTotal = Math.max(0, total - 1);
        setTotal(nextTotal);
        const nextPage = Math.min(
          page,
          Math.max(1, Math.ceil(nextTotal / pageSize)),
        );
        if (nextPage !== page) setPage(nextPage);
      } else {
        setPayments((current) =>
          current.map((item) =>
            item._id === payment._id
              ? { ...item, deletedAt: undefined }
              : item,
          ),
        );
      }
      toast.success("Payment restored.");
      router.refresh();
    } catch (reason) {
      toast.error(getDisplayErrorMessage(reason, "Unable to restore payment."));
    }
  }

  async function showAction(payment: Payment, nextAction: PaymentAction) {
    setActivePayment(payment);
    setAction(nextAction);
    if (nextAction === "delete") return;
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/payments/${payment._id}`,
      );
      const result = (await response.json()) as {
        payment?: Payment;
        error?: string;
      };
      if (!response.ok || !result.payment)
        throw new Error(result.error ?? "Unable to load payment details.");
      setActivePayment(result.payment);
    } catch (reason) {
      setAction(null);
      toast.error(
        getDisplayErrorMessage(reason, "Unable to load payment details."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  function updatePayment(payment: Payment) {
    setPayments((current) =>
      current.map((item) => (item._id === payment._id ? payment : item)).sort(
        (a, b) =>
          new Date(a.paidAt ?? 0).getTime() -
          new Date(b.paidAt ?? 0).getTime(),
      ),
    );
  }

  return (
    <section className="mt-4 min-w-0 overflow-hidden  rounded-xl border border-black/10 bg-white p-2 sm:mt-6 sm:rounded-2xl sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="pt-2 text-sm font-semibold sm:pt-0 sm:text-base">Payments</h2>
        <div className="flex flex-wrap items-center gap-2">
          <AdminListFilters
          fields={[
            {
              name: "archive",
              label: "Records",
              value: archive,
              options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
                { value: "all", label: "All records" },
              ],
            },
          ]}
        />
        <PaymentCreateDialog
          clientId={clientId}
          projectId={projectId}
          onSubmit={create}
        />
        </div>
      </div>
      <ol className="mt-3 overflow-x-auto overscroll-x-contain sm:mt-5">
        {isLoading && (
          Array.from({ length: 3 }, (_, index) => (
            <li key={index} aria-hidden="true" className="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)_2.5rem] gap-x-2 py-3 sm:grid-cols-[5.5rem_1rem_minmax(0,1fr)_auto] sm:gap-x-3">
              <div className="hidden h-10 w-24 animate-pulse rounded bg-black/10 motion-reduce:animate-none sm:block" />
              <span className="size-2.5 rounded-full bg-black/10" />
              <div className="space-y-2">
                <div className="h-5 w-28 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
                <div className="h-4 w-20 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              </div>
              <div className="size-10 animate-pulse rounded-lg bg-black/10 motion-reduce:animate-none" />
            </li>
          ))
        )}
        {!isLoading && payments.length === 0 && (
          <li className="py-4 text-sm text-black/50">No payment records yet.</li>
        )}
        {!isLoading && payments.map((payment, index) => {
          const date = payment.paidAt;
          return (
            <li
              key={payment._id}
              className="relative grid min-w-0 grid-cols-[1rem_minmax(0,1fr)_2.5rem] gap-x-2 py-3 first:pt-2 last:pb-2 sm:grid-cols-[minmax(5.5rem,auto)_1rem_minmax(0,1fr)_auto] sm:gap-x-3 sm:pb-5 sm:pt-0 sm:last:pb-0"
            >
              <div className="hidden justify-items-end w-28 pt-0.5 text-right text-xs leading-5 tabular-nums text-black/55 sm:grid">
                {date ? (
                  <time dateTime={date} className="grid">
                    <span>{new Date(date).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}</span>
                    <span>{new Date(date).toLocaleTimeString(undefined, {
                      timeStyle: "short",
                    })}</span>
                  </time>
                ) : (
                  <span className="w-28">Date not recorded</span>
                )}
                <RecordBadge status={payment.status} className="mt-1 w-fit" />
              </div>
              <span
                aria-hidden="true"
                className="relative col-start-1 row-span-2 flex justify-center pt-1.5 sm:col-start-2 sm:row-span-1"
              >
                <span className="size-2.5 rounded-full bg-[#602329]" />
                {index < payments.length - 1 && (
                  <span className="absolute bottom-0 top-4 w-px bg-black/10" />
                )}
              </span>
              <div className="col-start-2 row-start-1 min-w-0 sm:col-start-3 sm:row-start-1">
                <p className="break-words text-sm font-semibold leading-5 tabular-nums sm:text-base">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
                <span className="mt-0.5 block text-[11px] leading-4 text-black/55 sm:hidden">
                  {date ? (
                    <time dateTime={date} className="grid">
                      <span>{new Date(date).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}</span>
                      <span>{new Date(date).toLocaleTimeString(undefined, {
                        timeStyle: "short",
                      })}</span>
                    </time>
                  ) : "Date not recorded"}
                </span>
                <RecordBadge
                  status={payment.status}
                  className="mt-1 px-2 py-0.5 text-[10px] sm:hidden"
                />
                <span className="mt-1 block text-xs capitalize leading-4 text-black/55 sm:text-sm">
                  {payment.method.replaceAll("-", " ")}
                </span>
              </div>
              <div className="col-start-3 row-start-1 row-span-2 sm:col-start-4 sm:row-span-1">
                {payment._id.startsWith("optimistic-") ? (
                  <span role="status" className="text-xs text-[#602329]">
                    Saving…
                  </span>
                ) : (
                  <RecordActionsMenu
                    label={`payment ${payment.currency} ${payment.amount}`}
                    edit={{ onSelect: () => void showAction(payment, "edit") }}
                    details={{ onSelect: () => void showAction(payment, "details") }}
                    detailsLabel="Details"
                    restore={
                      payment.deletedAt
                        ? { onSelect: () => void restore(payment) }
                        : undefined
                    }
                    delete={{ onSelect: () => void showAction(payment, "delete") }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {total > pageSize && (
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm">
          <span>Page {page}</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page * pageSize >= total}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#602329]">
          {error}
        </p>
      )}
      {activePayment && action === "edit" && (
        actionLoading ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-busy="true"
            aria-label="Loading payment for editing"
            className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
          >
            <div className="w-full max-w-lg space-y-3 rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
              <div className="h-6 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-16 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            </div>
          </div>
        ) : (
          <PaymentEditDialog
            payment={activePayment}
            clientId={clientId}
            onOptimisticChange={updatePayment}
            onClose={() => setAction(null)}
            onSaved={(saved) => {
              updatePayment(saved);
              setAction(null);
              router.refresh();
            }}
          />
        )
      )}
      {activePayment && action === "details" && (
        <PaymentDetailsDialog
          payment={activePayment}
          loading={actionLoading}
          onClose={() => setAction(null)}
        />
      )}
      {activePayment && action === "delete" && (
        <DeleteConfirmationDialog
          label={`Delete payment ${activePayment.currency} ${activePayment.amount}`}
          description="Archive this payment from active records."
          onConfirm={(mode) => remove(activePayment._id, mode)}
          modeOptions={activePayment.deletedAt ? "permanent-only" : "soft-and-permanent"}
          onRecovery={() => setAction("delete")}
          open
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
          trigger={null}
        />
      )}
    </section>
  );
}

function PaymentCreateDialog({
  clientId,
  projectId,
  onSubmit,
}: {
  clientId: string;
  projectId?: string;
  onSubmit: (values: PaymentFormValues) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const close = () => {
    setOpen(false);
    setMounted(false);
  };
  const dialogRef = useDialogEscape(open, close, pending);
  return (
    <>
      <Button type="button" onClick={() => { setMounted(true); setOpen(true); }}>
        Add payment
      </Button>
      {mounted && (
        <div
          ref={dialogRef}
          onClick={(event) => event.stopPropagation()}
          className={`fixed inset-0 z-50 place-items-center bg-black/40 p-4 ${open ? "grid" : "hidden"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div
            onClick={(event) => event.stopPropagation()}
          >
            <PaymentForm
              title="Add payment"
              titleId={titleId}
              clientId={clientId}
              projectId={projectId}
              onSubmit={onSubmit}
              onCancel={close}
              onSuccess={close}
              onOptimisticClose={() => setOpen(false)}
              onRecovery={() => setOpen(true)}
              onPendingChange={setPending}
            />
          </div>
        </div>
      )}
    </>
  );
}

function PaymentEditDialog({
  payment,
  clientId,
  onOptimisticChange,
  onClose,
  onSaved,
}: {
  payment: Payment;
  clientId: string;
  onOptimisticChange: (payment: Payment) => void;
  onClose: () => void;
  onSaved: (payment: Payment) => void;
}) {
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(true);
  const titleId = useId();
  const dialogRef = useDialogEscape(visible, onClose, pending);
  const savedPayment = useRef(payment);

  async function submit(values: PaymentFormValues) {
    const optimistic = { ...payment, ...values };
    onOptimisticChange(optimistic);
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch(
        `/api/admin/clients/${clientId}/payments/${payment._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken
              ? { "x-csrf-token": decodeURIComponent(csrfToken) }
              : {}),
          },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json()) as {
        error?: string;
        payment?: Payment;
      };
      if (!response.ok || !result.payment)
        throw new Error(result.error ?? "Unable to update payment.");
      savedPayment.current = result.payment;
      toast.success("Payment updated.");
      return null;
    } catch (reason) {
      onOptimisticChange(payment);
      const message = getDisplayErrorMessage(reason, "Unable to update payment.");
      return message;
    }
  }

  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className={`fixed inset-0 z-[60] place-items-center bg-black/40 p-4 ${visible ? "grid" : "hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        onClick={(event) => event.stopPropagation()}
      >
        <PaymentForm
          payment={payment}
          title="Edit payment"
          titleId={titleId}
          clientId={clientId}
          projectId={payment.projectId}
          onSubmit={submit}
          onCancel={onClose}
          onSuccess={() => onSaved(savedPayment.current)}
          onOptimisticClose={() => setVisible(false)}
          onRecovery={() => setVisible(true)}
          onPendingChange={setPending}
        />
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

type Payment = { _id: string; amount: number; currency: string; method: string; status: string; milestone?: string; paidAt?: string };
const pageSize = 10;

export default function PaymentManager({ clientId, projectId }: { clientId: string; projectId?: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Payment | null>(null);
  const totalPaid = useMemo(() => payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0), [payments]);

  const load = () =>   fetch(`/api/admin/clients/${clientId}/payments?${new URLSearchParams({ ...(projectId ? { projectId } : {}), page: String(page), limit: String(pageSize) })}`).then(async (response) => {
    const result = await response.json() as { payments?: Payment[]; pagination?: { total: number }; error?: string };
    if (response.ok) { setPayments(result.payments ?? []); setTotal(result.pagination?.total ?? 0); }
    else setError(result.error ?? "Unable to load payments.");
  }).catch(() => setError("Unable to load payments."));
  useEffect(() => { void load();   }, [clientId, projectId, page]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ ...Object.fromEntries(form.entries()), projectId }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Unable to save payment.");
    else { event.currentTarget.reset(); setError(""); void load(); }
  }

  async function remove(paymentId: string) {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/payments/${paymentId}`, { method: "DELETE", headers: { "x-confirm-delete": paymentId, ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) } });
    if (response.ok) setPayments((current) => current.filter((payment) => payment._id !== paymentId));
    else { const result = await response.json() as { error?: string }; setError(result.error ?? "Unable to delete payment."); }
  }

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Payments</h2><p className="mt-1 text-sm text-black/50">Paid total: {totalPaid.toLocaleString()} across {payments.length} records.</p></div></div>
      <div className="mt-4 divide-y divide-black/10">{payments.length === 0 && <p className="py-4 text-sm text-black/50">No payment records yet.</p>}{payments.map((payment) => <div key={payment._id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{payment.currency} {payment.amount.toLocaleString()}</p><p className="mt-1 text-xs capitalize text-black/50">{payment.status} · {payment.method.replace("-", " ")}{payment.milestone ? ` · ${payment.milestone}` : ""}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-semibold capitalize">{payment.status}</span><Button type="button" variant="outline" size="sm" onClick={() => setEditing(payment)}>Edit</Button><DeleteConfirmationDialog label={`Delete payment ${payment.currency} ${payment.amount}`} description="Archive this payment from active records." onConfirm={() => remove(payment._id)} /></div></div>)}</div>
      {total > pageSize && <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-sm"><span>Page {page}</span><div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button type="button" size="sm" variant="outline" disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
      <div className="mt-5 border-t border-black/10 pt-5"><PaymentCreateDialog onSubmit={create} /></div>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
      {editing && <PaymentEditDialog payment={editing} clientId={clientId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
    </section>
  );
}

function PaymentCreateDialog({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [open, setOpen] = useState(false);
  return <><Button type="button" onClick={() => setOpen(true)}>Add payment</Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-payment-title"><form onSubmit={(event) => { onSubmit(event); setOpen(false); }} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 id="add-payment-title" className="text-xl font-semibold">Add payment</h2>
        <label className="text-sm font-medium">Amount<input name="amount" type="number" min="0.01" step="0.01" required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium">Currency<Select name="currency" defaultValue="INR"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></Select></label>
        <label className="text-sm font-medium">Method<Select name="method" defaultValue="bank-transfer"><option value="bank-transfer">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option><option value="other">Other</option></Select></label>
        <label className="text-sm font-medium">Status<Select name="status" defaultValue="pending"><option>pending</option><option>paid</option><option>partial</option><option>overdue</option><option>cancelled</option></Select></label>
        <label className="text-sm font-medium">Milestone<input name="milestone" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium">UTR/reference<input name="utrReference" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium sm:col-span-2">Notes<textarea name="notes" rows={3} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label>
        <div className="mt-4 flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add payment</Button></div>
      </form></div>}</>;
}

function PaymentEditDialog({ payment, clientId, onClose, onSaved }: { payment: Payment; clientId: string; onClose: () => void; onSaved: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch(`/api/admin/clients/${clientId}/payments/${payment._id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) }, body: JSON.stringify(data) });
    if (response.ok) onSaved();
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 className="text-xl font-semibold">Edit payment</h2><input name="amount" type="number" step="0.01" required defaultValue={payment.amount} className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3" /><select name="currency" defaultValue={payment.currency} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select><select name="method" defaultValue={payment.method} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"><option value="bank-transfer">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option><option value="other">Other</option></select><select name="status" defaultValue={payment.status} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"><option>pending</option><option>paid</option><option>partial</option><option>overdue</option><option>cancelled</option></select><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save changes</Button></div></form></div>;
}

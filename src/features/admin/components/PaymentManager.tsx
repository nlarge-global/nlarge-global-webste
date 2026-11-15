"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";

type Payment = { _id: string; amount: number; currency: string; method: string; status: string; milestone?: string; paidAt?: string };

export default function PaymentManager({ clientId, projectId }: { clientId: string; projectId?: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const totalPaid = useMemo(() => payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0), [payments]);

  const load = () => fetch(`/api/admin/clients/${clientId}/payments${projectId ? `?projectId=${projectId}` : ""}`).then(async (response) => {
    const result = await response.json() as { payments?: Payment[]; error?: string };
    if (response.ok) setPayments(result.payments ?? []);
    else setError(result.error ?? "Unable to load payments.");
  }).catch(() => setError("Unable to load payments."));
  useEffect(() => { void load();   }, [clientId, projectId]);

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

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Payments</h2><p className="mt-1 text-sm text-black/50">Paid total: {totalPaid.toLocaleString()} across {payments.length} records.</p></div></div>
      <div className="mt-4 divide-y divide-black/10">{payments.length === 0 && <p className="py-4 text-sm text-black/50">No payment records yet.</p>}{payments.map((payment) => <div key={payment._id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{payment.currency} {payment.amount.toLocaleString()}</p><p className="mt-1 text-xs capitalize text-black/50">{payment.status} · {payment.method.replace("-", " ")}{payment.milestone ? ` · ${payment.milestone}` : ""}</p></div><span className="rounded-full bg-[#f5f3f0] px-3 py-1 text-xs font-semibold capitalize">{payment.status}</span></div>)}</div>
      <form onSubmit={create} className="mt-5 grid gap-3 border-t border-black/10 pt-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Amount<input name="amount" type="number" min="0.01" step="0.01" required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium">Currency<select name="currency" defaultValue="INR" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
        <label className="text-sm font-medium">Method<select name="method" defaultValue="bank-transfer" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option value="bank-transfer">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option><option value="other">Other</option></select></label>
        <label className="text-sm font-medium">Status<select name="status" defaultValue="pending" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option>pending</option><option>paid</option><option>partial</option><option>overdue</option><option>cancelled</option></select></label>
        <label className="text-sm font-medium">Milestone<input name="milestone" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium">UTR/reference<input name="utrReference" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium sm:col-span-2">Notes<textarea name="notes" rows={3} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label>
        <Button type="submit" className="sm:col-span-2">Add payment</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
    </section>
  );
}

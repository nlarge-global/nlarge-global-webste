import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentRecord } from "@/features/admin/models/payment";
import Pagination from "@/features/admin/components/Pagination";

const PAGE_SIZE = 25;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [payments, total] = await Promise.all([
    PaymentRecord.find().sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    PaymentRecord.countDocuments(),
  ]);
  return <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Overview</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Payments</h1><section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white"><div className="divide-y divide-black/10">{payments.length === 0 && <p className="p-5 text-sm text-black/50">No payment records yet.</p>}{payments.map((payment) => <Link key={String(payment._id)} href={payment.projectId ? `/admin/clients/${payment.clientId}/projects/${payment.projectId}/payments` : `/admin/clients/${payment.clientId}`} className="block p-5 hover:bg-[#faf2ec]"><p className="font-medium">{payment.milestone || "Payment record"}</p><p className="mt-1 text-sm text-black/50">{payment.status} · {payment.amount} {payment.currency}{!payment.projectId ? " · needs project assignment" : ""}</p></Link>)}</div><Pagination page={page} hasNext={page * PAGE_SIZE < total} basePath="/admin/overview/payments" /></section></div>;
}

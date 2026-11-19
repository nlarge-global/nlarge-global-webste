import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentRecord } from "@/features/admin/models/payment";
import Pagination from "@/features/admin/components/Pagination";
import RecordBadge from "@/features/admin/components/RecordBadge";
import { formatCurrency } from "@/features/admin/services/currency";
import AdminListFilters from "@/features/admin/components/AdminListFilters";
import {
  getArchiveQuery,
  includesArchived,
  parseArchiveFilter,
} from "@/features/admin/services/archive-filter";

const PAGE_SIZE = 10;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string; archive?: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const archive = parseArchiveFilter(params.archive);
  const filter = getArchiveQuery(archive);
  const options = { includeDeleted: includesArchived(archive) };
  const [payments, total] = await Promise.all([
    PaymentRecord.find(filter).setOptions(options).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    PaymentRecord.countDocuments(filter).setOptions(options),
  ]);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
        Overview
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Payments</h1>
      <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
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
        <div className="divide-y divide-black/10">
          {payments.length === 0 && (
            <p className="p-5 text-sm text-black/50">No payment records yet.</p>
          )}
          {payments.map((payment) => (
            <Link
              key={String(payment._id)}
              href={
                payment.projectId
                  ? `/admin/clients/${payment.clientId}/projects/${payment.projectId}/payments`
                  : `/admin/clients/${payment.clientId}`
              }
              className="block p-5 hover:bg-[#faf2ec]"
            >
              <p className="font-medium">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/50">
                <RecordBadge status={payment.status} />
                <span>{payment.method.replaceAll("-", " ")}</span>
                {!payment.projectId && <span>Needs project assignment</span>}
              </p>
            </Link>
          ))}
        </div>
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          basePath="/admin/overview/payments"
          queryParams={{ archive }}
        />
      </section>
    </div>
  );
}

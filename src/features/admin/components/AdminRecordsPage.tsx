import Link from "next/link";
import { AdminBreadcrumbs } from "./AdminShell";

type RecordRow = {
  id: string;
  title: string;
  detail: string;
  href?: string;
};

export default function AdminRecordsPage({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: RecordRow[];
}) {
  return (
    <div>
      <AdminBreadcrumbs current={title} />
      <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">{description}</p>
      <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-black/50">No {title.toLowerCase()} found.</p>
        ) : (
          <div className="divide-y divide-black/10">
            {rows.map((row) => {
              const content = <><p className="font-medium">{row.title}</p><p className="mt-1 text-sm text-black/50">{row.detail}</p></>;
              return row.href ? <Link key={row.id} href={row.href} className="block p-5 hover:bg-[#f5f3f0]">{content}</Link> : <div key={row.id} className="p-5">{content}</div>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

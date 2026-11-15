import Link from "next/link";
import { AdminBreadcrumbs } from "./AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteRowAction from "./DeleteRowAction";
import { AdminPagination } from "@/components/ui/pagination";

type RecordRow = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  deleteEndpoint?: string;
  deleteDescription?: string;
};

export default function AdminRecordsPage({
  title,
  description,
  rows,
  pagination,
}: {
  title: string;
  description: string;
  rows: RecordRow[];
  pagination?: { page: number; total: number; pageSize?: number; basePath: string };
}) {
  return (
    <div>
      <AdminBreadcrumbs current={title} />
      <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
        {rows.length === 0 ? (
          <CardContent><p className="text-sm text-black/50">No {title.toLowerCase()} found.</p></CardContent>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Record</TableHead><TableHead>Details</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
            {rows.map((row) => {
              return <TableRow key={row.id}><TableCell>{row.href ? <Link href={row.href} className="font-medium text-[#602329] hover:underline">{row.title}</Link> : row.title}</TableCell><TableCell className="text-black/55">{row.detail}</TableCell><TableCell className="text-right">{row.deleteEndpoint && <DeleteRowAction endpoint={row.deleteEndpoint} label={`Delete ${row.title}`} description={row.deleteDescription ?? `Archive ${row.title} and remove it from active records?`} />}</TableCell></TableRow>;
            })}
            </TableBody>
          </Table>
        )}
        {pagination && <AdminPagination {...pagination} />}
      </Card>
    </div>
  );
}

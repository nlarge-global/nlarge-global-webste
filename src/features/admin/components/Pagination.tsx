import Link from "next/link";

export default function Pagination({ page, hasNext, basePath }: { page: number; hasNext: boolean; basePath: string }) {
  return <nav aria-label="Pagination" className="flex items-center justify-end gap-2 border-t border-black/10 p-4 text-sm"><span>Page {page}</span>{page > 1 && <Link href={`${basePath}?page=${page - 1}`} className="rounded-lg border border-black/10 px-3 py-2">Previous</Link>}{hasNext && <Link href={`${basePath}?page=${page + 1}`} className="rounded-lg border border-black/10 px-3 py-2">Next</Link>}</nav>;
}

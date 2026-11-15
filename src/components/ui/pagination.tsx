import Link from "next/link";
import { buttonVariants } from "./button";
import { cn } from "@/lib/cn";

export function Pagination({ page, hasNext, basePath, param = "page" }: { page: number; hasNext: boolean; basePath: string; param?: string }) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-black/10 p-4">
      <span className="text-sm text-black/50">Page {page}</span>
      <div className="flex gap-2">
        {page > 1 && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`${basePath}?${param}=${page - 1}`}>Previous</Link>}
        {hasNext && <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`${basePath}?${param}=${page + 1}`}>Next</Link>}
      </div>
    </nav>
  );
}

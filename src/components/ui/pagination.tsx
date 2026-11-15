import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from "react-icons/fi";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button-variants";

export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return <nav aria-label="Pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export function PaginationItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

export function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: ComponentProps<typeof Link> & { isActive?: boolean; size?: "default" | "sm" | "lg" | "icon" }) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        isActive && "border-[#602329] text-[#602329]",
        className,
      )}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 px-2.5 sm:pr-2.5", className)} {...props}>
      <FiChevronLeft aria-hidden="true" />
      <span>Previous</span>
    </PaginationLink>
  );
}

export function PaginationNext({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 px-2.5 sm:pl-2.5", className)} {...props}>
      <span>Next</span>
      <FiChevronRight aria-hidden="true" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span aria-hidden="true" className={cn("flex size-10 items-center justify-center", className)} {...props}>
      <FiMoreHorizontal aria-hidden="true" />
    </span>
  );
}

function getPageItems(page: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, 4, "ellipsis", totalPages] as const;
  if (page >= totalPages - 2) return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis-next", totalPages] as const;
}

export function AdminPagination({
  page,
  total,
  pageSize = 10,
  basePath,
  param = "page",
}: {
  page: number;
  total: number;
  pageSize?: number;
  basePath: string;
  param?: string;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const href = (value: number) => `${basePath}?${param}=${value}`;
  return (
    <Pagination className="border-t border-black/10 p-4">
      <PaginationContent>
        {page > 1 && <PaginationItem><PaginationPrevious  href={href(page - 1)} /></PaginationItem>}
        {getPageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <PaginationItem key={item}><PaginationEllipsis /></PaginationItem>
          ) : (
            <PaginationItem key={item}><PaginationLink href={href(item)} isActive={item === page}>{item}</PaginationLink></PaginationItem>
          ),
        )}
        {page < totalPages && <PaginationItem><PaginationNext href={href(page + 1)} /></PaginationItem>}
      </PaginationContent>
    </Pagination>
  );
}

export function PaginationSummary({ page, total, pageSize = 10 }: { page: number; total: number; pageSize?: number }) {
  return <span className="text-sm text-black/50">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span>;
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getClearFiltersHref } from "@/features/admin/services/admin-list-filters";

export default function ClearAdminFiltersButton({
  fieldNames,
}: {
  fieldNames: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <button
      type="button"
      onClick={() =>
        router.push(
          getClearFiltersHref(pathname, searchParams.toString(), fieldNames),
          { scroll: false },
        )
      }
      className="inline-flex min-h-8 cursor-pointer items-center rounded-lg border border-black/15 bg-white px-2.5 text-xs font-medium text-[#602329] transition-colors hover:bg-[#f5f3f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
    >
      Clear filters
    </button>
  );
}

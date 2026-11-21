"use client";

import type { FormEvent, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getQueryFormHref } from "@/features/admin/services/admin-list-filters";

export default function AdminQueryForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: [string, string][] = [];
    new FormData(event.currentTarget).forEach((value, name) => {
      if (typeof value === "string") values.push([name, value]);
    });
    router.push(getQueryFormHref(pathname, values), { scroll: false });
  }

  return (
    <form method="get" action={pathname} onSubmit={submit} className={className}>
      {children}
    </form>
  );
}

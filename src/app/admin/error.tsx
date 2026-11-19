"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    void fetch("/api/admin/operations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
      },
      body: JSON.stringify({
        event: "client.window_error",
        route: window.location.pathname,
        message: error.digest
          ? `Admin page rendering failed. Next.js digest: ${error.digest}`
          : "Admin page rendering failed.",
        errorName: error.name,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [error]);

  return (
    <section
      role="alert"
      className="mx-auto max-w-xl rounded-2xl border border-[#602329]/20 bg-white p-6 sm:p-8"
    >
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">
        This admin page could not load
      </h1>
      <p className="mt-2 text-sm leading-6 text-black/65">
        The issue was recorded in Operations. Try again; if it continues, check the Operations log.
      </p>
      <Button type="button" className="mt-5" onClick={retry}>
        Try again
      </Button>
    </section>
  );
}

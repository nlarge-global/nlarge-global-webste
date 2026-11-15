"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiRotateCcw } from "react-icons/fi";
import { Button } from "./ui/Button";

export default function RestoreProspectButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function restore() {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/prospects/${id}/restore`, {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {},
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to restore this prospect.");
        return;
      }
      router.replace("/admin/prospects");
      router.refresh();
    } catch {
      setError("Unable to restore this prospect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" disabled={pending} onClick={restore} className="gap-2">
        <FiRotateCcw aria-hidden="true" />
        {pending ? "Restoring…" : "Restore"}
      </Button>
      {error && <span role="alert" className="text-right text-xs text-[#602329]">{error}</span>}
    </span>
  );
}

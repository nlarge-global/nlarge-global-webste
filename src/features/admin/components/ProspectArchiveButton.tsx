"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

export default function ProspectArchiveButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function archive() {
    if (!window.confirm("Archive this prospect? It will be removed from the active list.")) return;
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/prospects/${id}`, {
        method: "DELETE",
        headers: {
          "x-confirm-delete": id,
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to archive prospect.");
        return;
      }
      router.push("/admin/prospects");
      router.refresh();
    } catch {
      setError("Unable to archive prospect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" variant="outline" onClick={archive} disabled={pending}>
        {pending ? "Archiving…" : "Archive prospect"}
      </Button>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
    </div>
  );
}

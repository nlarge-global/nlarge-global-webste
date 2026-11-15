"use client";

import { useRouter } from "next/navigation";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

export default function DeleteRowAction({ endpoint, label, description, redirectTo }: { endpoint: string; label: string; description: string; redirectTo?: string }) {
  const router = useRouter();
  async function remove() {
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const confirmation = new URL(endpoint, window.location.origin).searchParams.get("taskId") ?? endpoint.split("/").pop() ?? "";
    await fetch(endpoint, { method: "DELETE", headers: { "x-confirm-delete": confirmation, ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) } });
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }
  return <DeleteConfirmationDialog label={label} description={description} onConfirm={remove} />;
}

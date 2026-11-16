"use client";

import { useRouter } from "next/navigation";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

export default function SubscriberDeleteAction({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const response = await fetch(`/api/admin/subscribers/${id}`, {
      method: "DELETE",
      headers: {
        "x-confirm-delete": id,
        ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
      },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Unable to delete subscriber.");
    }
    router.refresh();
  }

  return (
    <DeleteConfirmationDialog
      label="Delete subscriber"
      description="Permanently delete this mailing-list entry and its consent history? The separate inquiry record and its consent evidence will remain. This is not a full data-erasure request."
      onConfirm={remove}
    />
  );
}

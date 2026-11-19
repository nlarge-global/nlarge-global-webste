"use client";

import { useRouter } from "next/navigation";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { deleteAdminRecord } from "./admin-delete";

export default function SubscriberDeleteAction({ id }: { id: string }) {
  const router = useRouter();

  async function remove(mode: "soft" | "permanent") {
    await deleteAdminRecord(
      `/api/admin/subscribers/${id}`,
      id,
      mode,
      "Unable to permanently delete subscriber.",
    );
    router.refresh();
  }

  return (
    <DeleteConfirmationDialog
      label="Delete subscriber"
      description="Permanently delete this mailing-list entry and its consent history? The separate inquiry record and its consent evidence will remain. This is not a full data-erasure request."
      onConfirm={remove}
      modeOptions="permanent-only"
    />
  );
}

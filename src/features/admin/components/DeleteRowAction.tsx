"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { deleteAdminRecord, type DeleteMode } from "./admin-delete";

export default function DeleteRowAction({
  endpoint,
  label,
  description,
  redirectTo,
  open,
  onOpenChange,
  trigger,
}: {
  endpoint: string;
  label: string;
  description: string;
  redirectTo?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  async function remove(mode: DeleteMode) {
    const confirmation = new URL(endpoint, window.location.origin).searchParams.get("taskId") ?? endpoint.split("/").pop() ?? "";
    await deleteAdminRecord(endpoint, confirmation, mode, `Unable to complete ${label} action.`);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }
  return (
    <DeleteConfirmationDialog
      label={label}
      description={description}
      onConfirm={remove}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
    />
  );
}

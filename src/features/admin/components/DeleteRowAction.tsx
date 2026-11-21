"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import {
  deleteAdminRecord,
  waitForDeleteFeedback,
  type DeleteMode,
} from "./admin-delete";

export default function DeleteRowAction({
  endpoint,
  label,
  description,
  redirectTo,
  open,
  onOpenChange,
  onRecovery,
  modeOptions,
  trigger,
}: {
  endpoint: string;
  label: string;
  description: string;
  redirectTo?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRecovery?: () => void;
  modeOptions?: "soft-and-permanent" | "permanent-only";
  trigger?: ReactNode;
}) {
  const router = useRouter();
  async function remove(mode: DeleteMode) {
    const startedAt = Date.now();
    const confirmation = new URL(endpoint, window.location.origin).searchParams.get("taskId") ?? endpoint.split("/").pop() ?? "";
    await deleteAdminRecord(endpoint, confirmation, mode, `Unable to complete ${label} action.`);
    await waitForDeleteFeedback(startedAt);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }
  return (
    <DeleteConfirmationDialog
      label={label}
      description={description}
      onConfirm={remove}
      modeOptions={modeOptions}
      open={open}
      onOpenChange={onOpenChange}
      onRecovery={onRecovery}
      trigger={trigger}
    />
  );
}

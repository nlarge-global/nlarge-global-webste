"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentRecord } from "./DocumentManager";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { Button } from "./ui/Button";

export default function DocumentActions({
  clientId,
  document: record,
}: {
  clientId: string;
  document: DocumentRecord;
}) {
  const [error, setError] = useState("");
  const router = useRouter();

  async function openDocument() {
    setError("");
    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/documents/${record._id}`,
      );
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? "Unable to open document.");
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setError(
        getDisplayErrorMessage(reason, "Unable to open document."),
      );
    }
  }

  async function deleteDocument() {
    setError("");
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];
    const response = await fetch(
      `/api/admin/clients/${clientId}/documents/${record._id}`,
      {
        method: "DELETE",
        headers: {
          "x-confirm-delete": record._id,
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
      },
    );
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      throw new Error(result.error ?? "Unable to delete document.");
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2 self-end sm:self-auto">
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => void openDocument()} variant="outline" size="sm">
          Open file
        </Button>
        <DeleteConfirmationDialog
          label={`Delete ${record.filename}`}
          description="Archive this document while retaining its private object for troubleshooting."
          onConfirm={deleteDocument}
        />
      </div>
      {error && <p role="alert" className="text-sm text-[#602329]">{error}</p>}
    </div>
  );
}

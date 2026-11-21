import type { DeleteMode } from "@/features/admin/services/delete-mode";

export type { DeleteMode };

export const DELETE_FEEDBACK_MS = 500;

export async function waitForDeleteFeedback(startedAt: number) {
  const remaining = DELETE_FEEDBACK_MS - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  }
}

async function runRecordAction(
  endpoint: string,
  id: string,
  mode: DeleteMode | "restore",
  fallback: string,
) {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("mode", mode);
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
    ?.split("=")[1];
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "x-confirm-delete": id,
      ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
    },
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? fallback);
}

export function deleteAdminRecord(
  endpoint: string,
  id: string,
  mode: DeleteMode,
  fallback: string,
) {
  return runRecordAction(endpoint, id, mode, fallback);
}

export function restoreAdminRecord(endpoint: string, id: string, fallback: string) {
  return runRecordAction(endpoint, id, "restore", fallback);
}

import type { DeleteMode } from "@/features/admin/services/delete-mode";

export type { DeleteMode };

export async function deleteAdminRecord(
  endpoint: string,
  id: string,
  mode: DeleteMode,
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

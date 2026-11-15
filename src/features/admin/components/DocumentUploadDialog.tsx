"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";

export default function DocumentUploadDialog({
  clientId,
  projectId,
}: {
  clientId: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const dialogRef = useDialogEscape(open && !pending, () => setOpen(false));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    formData.set("projectId", projectId);
    const csrfToken = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
      ?.split("=")[1];

    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/documents`, {
        method: "POST",
        headers: csrfToken
          ? { "x-csrf-token": decodeURIComponent(csrfToken) }
          : undefined,
        body: formData,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Unable to upload document.");

      formElement.reset();
      setOpen(false);
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to upload document.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Upload document
      </Button>
      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-document-title"
        >
          <form
            onSubmit={submit}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
          >
            <h2 id="upload-document-title" className="text-xl font-semibold">
              Upload document
            </h2>
            <label className="mt-4 block text-sm font-medium">
              Filename
              <input
                name="filename"
                className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              File
              <input
                name="file"
                type="file"
                accept=".pdf,image/png,image/jpeg"
                required
                className="mt-2 block min-h-11 w-full rounded-xl border border-black/15 p-2 text-sm"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Description
              <textarea
                name="description"
                rows={2}
                className="mt-2 w-full rounded-xl border border-black/15 p-3"
              />
            </label>
            {error && (
              <p role="alert" className="mt-3 text-sm text-[#602329]">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

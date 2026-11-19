"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { FiFileText, FiImage, FiUploadCloud, FiX } from "react-icons/fi";
import { toast } from "sonner";
import type { DocumentRecord } from "./DocumentManager";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";
import {
  documentUploadAccept,
  documentUploadConfig,
  formatFileSize,
  getDocumentType,
} from "@/features/admin/services/document-upload-config";
import { getDisplayErrorMessage } from "@/lib/error-message";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";

export default function DocumentFormDialog({
  document,
  onClose,
  onSubmit,
}: {
  document?: DocumentRecord;
  onClose: () => void;
  onSubmit: (
    formData: FormData,
    document?: DocumentRecord,
    onProgress?: (percent: number) => void,
  ) => Promise<string | null>;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const filenameRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const dialogRef = useDialogEscape(visible, onClose, pending);
  const fileType = file ? getDocumentType(file) : null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    const type = getDocumentType(nextFile);
    if (!type) {
      const message = `${nextFile.name}: only PDF, PNG, JPEG, ZIP, and TXT files are supported.`;
      setError(message);
      toast.error(message);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (nextFile.size > documentUploadConfig[type].maxSize) {
      const message = `${nextFile.name}: larger than ${formatFileSize(documentUploadConfig[type].maxSize)}.`;
      setError(message);
      toast.error(message);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError("");
    setFile(nextFile);
    if (filenameRef.current && !filenameRef.current.value) {
      filenameRef.current.value = nextFile.name;
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 1) {
      setError("Choose one file at a time.");
      return;
    }
    chooseFile(event.dataTransfer.files[0]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (file) formData.set("file", file);
    if (!document && !file) {
      const message = "Choose one file to upload.";
      setError(message);
      toast.error(message);
      return;
    }
    setPending(true);
    setProgress(0);
    setError("");
    setVisible(false);
    try {
      const message = await onSubmit(
        formData,
        document,
        (value) => setProgress(value),
      );
      if (message) {
        showOptimisticRecoveryToast(message, () => setVisible(true));
      }
    } catch (reason) {
      const message = getDisplayErrorMessage(reason, "Unable to save document.");
      showOptimisticRecoveryToast(message, () => setVisible(true));
    } finally {
      setPending(false);
    }
  }

  const FileIcon = file?.type.startsWith("image/") ? FiImage : FiFileText;

  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className={`fixed inset-0 z-[60] place-items-center bg-black/40 p-4 ${visible ? "grid" : "hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <form
        onSubmit={submit}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {document ? "Edit document" : "Upload document"}
        </h2>
        <label className="mt-4 block text-sm font-medium">
          Filename
          <input
            ref={filenameRef}
            name="filename"
            defaultValue={document?.filename}
            maxLength={200}
            required
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
          />
        </label>

        {!document && (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`mt-4 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
              dragging
                ? "border-[#602329] bg-[#602329]/5"
                : "border-black/20 bg-white"
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3 rounded-lg bg-[#f7f3f0] p-3 text-left">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={`Preview of ${file.name}`}
                    className="size-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded bg-white text-[#602329]">
                    <FileIcon aria-hidden="true" className="size-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block break-all text-sm font-medium">
                    {file.name}
                  </span>
                  <span className="mt-1 block text-xs text-black/55">
                    {fileType ? documentUploadConfig[fileType].label : ""} ·{" "}
                    {formatFileSize(file.size)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  title="Remove selected file"
                  disabled={pending}
                  onClick={() => {
                    setFile(null);
                    setError("");
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-black/60 hover:bg-white hover:text-[#602329] focus-visible:outline-2 focus-visible:outline-[#602329]"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <FiUploadCloud
                  aria-hidden="true"
                  className="mx-auto size-7 text-[#602329]"
                />
                <p className="mt-2 text-sm font-medium">
                  Drop a file here or choose a file
                </p>
                <p className="mt-1 text-xs leading-5 text-black/55">
                  PDF up to 10 MB, PNG/JPEG up to 5 MB, ZIP up to 25 MB, or TXT
                  up to 1 MB. One file per upload.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => inputRef.current?.click()}
                  disabled={pending}
                >
                  Browse files
                </Button>
              </>
            )}
            <input
              ref={inputRef}
              name="file"
              type="file"
              accept={documentUploadAccept}
              disabled={pending}
              onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
              className="sr-only"
              aria-label="Choose a document file"
            />
          </div>
        )}

        <label className="mt-3 block text-sm font-medium">
          Description
          <textarea
            name="description"
            rows={2}
            maxLength={1000}
            defaultValue={document?.description ?? ""}
            className="mt-2 w-full rounded-xl border border-black/15 p-3"
          />
        </label>
        <label className="mt-3 block text-sm font-medium">
          Tags
          <input
            name="tags"
            defaultValue={document?.tags?.join(", ") ?? ""}
            maxLength={1000}
            placeholder="proposal, signed, final"
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
          />
          <span className="mt-1 block text-xs font-normal text-black/55">
            Separate tags with commas.
          </span>
        </label>
        {pending && !document && (
          <div className="mt-4" aria-live="polite">
            <div className="flex justify-between text-xs text-black/60">
              <span>Uploading document</span>
              <span>{progress}%</span>
            </div>
            <progress
              className="mt-2 h-2 w-full accent-[#602329]"
              max={100}
              value={progress}
              aria-label="Document upload progress"
            />
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#8b3028]">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : document ? "Save changes" : "Upload"}
          </Button>
        </div>
      </form>
    </div>
  );
}

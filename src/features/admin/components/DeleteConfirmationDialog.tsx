"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import {
  useEffect,
  useRef,
  useState,
  useId,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiTrash2, FiX } from "react-icons/fi";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";
import {
  DELETE_FEEDBACK_MS,
  type DeleteMode,
} from "./admin-delete";

const HOLD_MS = 1600;

export default function DeleteConfirmationDialog({
  label,
  description,
  onConfirm,
  modeOptions = "soft-and-permanent",
  open: controlledOpen,
  onOpenChange,
  onRecovery,
  trigger,
}: {
  label: string;
  description: string;
  onConfirm: (mode: DeleteMode) => void | Promise<void>;
  modeOptions?: "soft-and-permanent" | "permanent-only";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRecovery?: () => void;
  trigger?: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [mode, setMode] = useState<DeleteMode>(
    modeOptions === "permanent-only" ? "permanent" : "soft",
  );
  const dialogId = useId();
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onRecoveryRef = useRef(onRecovery);
  onRecoveryRef.current = onRecovery;
  const open = controlledOpen ?? uncontrolledOpen;
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setMode(modeOptions === "permanent-only" ? "permanent" : "soft");
      setDeleted(false);
    }
    wasOpen.current = open;
  }, [open, modeOptions]);
  const setOpen = (next: boolean) => {
    if (!next) setHolding(false);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const dialogRef = useDialogEscape(open, () => {
    setHolding(false);
    setMode(modeOptions === "permanent-only" ? "permanent" : "soft");
    setOpen(false);
  }, confirming);

  useEffect(() => {
    if (!holding) return;
    const timer = window.setTimeout(() => {
      setHolding(false);
      setConfirming(true);
      setDeleted(true);
      void Promise.resolve()
        .then(() => onConfirmRef.current(modeRef.current))
        .catch((reason) => {
          const message = getDisplayErrorMessage(
            reason,
            "Unable to complete this action.",
          );
          showOptimisticRecoveryToast(
            message,
            onRecoveryRef.current ?? (() => setOpen(true)),
          );
        });
      window.setTimeout(() => {
        setConfirming(false);
        setOpen(false);
      }, DELETE_FEEDBACK_MS);
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [holding, controlledOpen, modeOptions]);

  function cancelHold() {
    if (!deleted) setHolding(false);
  }

  function startHold(
    event?: PointerEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) {
    if (event && "button" in event && event.button !== 0) return;
    if (!deleted && !confirming) {
      setHolding(true);
    }
  }

  return (
    <>
      {trigger === undefined ? (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label={label}
          title={label}
          onClick={() => setOpen(true)}
        >
          <FiTrash2 aria-hidden="true" />
        </Button>
      ) : trigger}
      {open &&
        createPortal(
          <div
            ref={dialogRef}
            onClick={(event) => event.stopPropagation()}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            aria-describedby={`${dialogId}-description`}
          >
            <div className="w-full max-w-md rounded-2xl bg-[#fffdfb] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id={`${dialogId}-title`} className="text-xl font-semibold">
                    Are you sure?
                  </h2>
                  <p
                    id={`${dialogId}-description`}
                    className="mt-2 text-sm leading-6 text-black/60"
                  >
                    {description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close delete confirmation"
                  title="Close delete confirmation"
                  disabled={confirming}
                  onClick={() => setOpen(false)}
                >
                  <FiX aria-hidden="true" />
                </Button>
              </div>
              {modeOptions === "soft-and-permanent" && (
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">Choose what to do</legend>
                  <div role="group" aria-label="Delete mode" className="mt-2 grid gap-2">
                    {([
                      ["soft", "Soft delete (archive)", "Hide from active records; can be restored."],
                      ["permanent", "Permanent delete", "Irreversible. Removes this record and its associated data."],
                    ] as const).map(([value, title, detail]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={mode === value}
                        disabled={confirming || deleted}
                        onClick={() => {
                          setMode(value);
                          setHolding(false);
                        }}
                        className={`rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#602329]/40 disabled:cursor-not-allowed cursor-pointer ${
                          mode === value
                            ? value === "permanent"
                              ? "border-red-300 bg-red-50 text-red-950"
                              : "border-[#602329]/40 bg-[#602329]/5 text-[#602329]"
                            : "border-black/15 bg-white text-black/75 hover:bg-[#f5f3f0]"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className="mt-1 block text-xs leading-5 opacity-75">{detail}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  autoFocus
                  disabled={confirming}
                  onClick={() => setOpen(false)}
                >
                  No
                </Button>
                <button
                  type="button"
                  className={`relative inline-flex h-11 min-w-44 items-center justify-center overflow-hidden rounded-lg px-4 font-medium text-white cursor-pointer outline-none transition focus-visible:ring-3 disabled:cursor-default ${
                    mode === "permanent"
                      ? "bg-red-800 focus-visible:ring-red-800/40"
                      : "bg-[#602329] focus-visible:ring-[#602329]/40"
                  }`}
                  data-state={deleted ? "deleted" : holding ? "holding" : "idle"}
                  disabled={deleted || confirming}
                  onPointerDown={startHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  onKeyDown={(event) => {
                    if (
                      (event.key === " " || event.key === "Enter") &&
                      !event.repeat
                    ) {
                      event.preventDefault();
                      startHold(event);
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === " " || event.key === "Enter") cancelHold();
                  }}
                  onBlur={cancelHold}
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {deleted ? (
                      <FiCheck aria-hidden="true" />
                    ) : (
                      <FiTrash2 aria-hidden="true" />
                    )}
                    <span aria-live="polite" aria-atomic="true">
                      {deleted
                        ? mode === "permanent"
                          ? "Permanently deleted"
                          : "Archived"
                        : mode === "permanent"
                          ? "Hold to delete permanently"
                          : "Hold to archive"}
                    </span>
                  </span>
                  <span
                    className={`absolute inset-y-0 left-0 transition-[width] ${mode === "permanent" ? "bg-red-950" : "bg-[#8b3a31]"} ${holding || deleted ? "w-full duration-[1600ms]" : "w-0 duration-150"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

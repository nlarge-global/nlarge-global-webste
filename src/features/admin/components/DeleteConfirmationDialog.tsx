"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { FiCheck, FiTrash2, FiX } from "react-icons/fi";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";

const HOLD_MS = 1600;

export default function DeleteConfirmationDialog({
  label,
  description,
  onConfirm,
}: {
  label: string;
  description: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const dialogRef = useDialogEscape(open, () => {
    setHolding(false);
    setOpen(false);
  }, confirming);

  useEffect(() => {
    if (!holding) return;
    const timer = window.setTimeout(async () => {
      setHolding(false);
      setConfirming(true);
      setError("");
      try {
        await onConfirmRef.current();
        setDeleted(true);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : "Unable to complete this action.",
        );
      } finally {
        setConfirming(false);
      }
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [holding]);

  function cancelHold() {
    if (!deleted) setHolding(false);
  }

  function startHold(
    event?: PointerEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) {
    if (event && "button" in event && event.button !== 0) return;
    if (!deleted && !confirming) {
      setError("");
      setHolding(true);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <FiTrash2 aria-hidden="true" />
      </Button>
      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#fffdfb] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-dialog-title" className="text-xl font-semibold">
                  Are you sure?
                </h2>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  {description}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close delete confirmation"
                disabled={confirming}
                onClick={() => setOpen(false)}
              >
                <FiX aria-hidden="true" />
              </Button>
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={confirming}
                onClick={() => setOpen(false)}
              >
                No
              </Button>
              <button
                type="button"
                className="relative inline-flex h-11 min-w-36 items-center justify-center overflow-hidden rounded-lg bg-[#602329] px-4 font-medium text-white cursor-pointer outline-none transition focus-visible:ring-3 focus-visible:ring-[#602329]/40 disabled:cursor-default"
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
                  {deleted ? "Deleted" : "Hold for Yes"}
                </span>
                <span
                  className={`absolute inset-y-0 left-0 bg-[#8b3a31] transition-[width] ${holding || deleted ? "w-full duration-[1600ms]" : "w-0 duration-150"}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

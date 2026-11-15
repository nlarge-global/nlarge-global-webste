"use client";

import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import { FiCheck, FiTrash2, FiX } from "react-icons/fi";
import { Button } from "./ui/Button";

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

  useEffect(() => {
    if (!holding) return;
    const timer = window.setTimeout(() => {
      setHolding(false);
      setDeleted(true);
      void onConfirm();
    }, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [holding, onConfirm]);

  function cancelHold() {
    if (!deleted) setHolding(false);
  }

  function startHold(event?: PointerEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) {
    if (event && "button" in event && event.button !== 0) return;
    if (!deleted) setHolding(true);
  }

  return (
    <>
      <Button type="button" variant="destructive" size="icon" aria-label={label} onClick={() => setOpen(true)}>
        <FiTrash2 aria-hidden="true" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="w-full max-w-md rounded-2xl bg-[#fffdfb] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="delete-dialog-title" className="text-xl font-semibold">Are you sure?</h2><p className="mt-2 text-sm leading-6 text-black/60">{description}</p></div>
              <button type="button" className="rounded-lg p-2 text-black/50 hover:bg-black/5" aria-label="Close delete confirmation" onClick={() => setOpen(false)}><FiX aria-hidden="true" /></button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>NO</Button>
              <button
                type="button"
                className="relative inline-flex h-11 min-w-36 items-center justify-center overflow-hidden rounded-lg bg-[#602329] px-4 font-medium text-white outline-none transition focus-visible:ring-3 focus-visible:ring-[#602329]/40 disabled:cursor-default"
                data-state={deleted ? "deleted" : holding ? "holding" : "idle"}
                disabled={deleted}
                onPointerDown={startHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                onKeyDown={(event) => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); startHold(event); } }}
                onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") cancelHold(); }}
                onBlur={cancelHold}
              >
                <span className="relative z-10 inline-flex items-center gap-2">{deleted ? <FiCheck aria-hidden="true" /> : <FiTrash2 aria-hidden="true" />}{deleted ? "Deleted" : "Hold for YES"}</span>
                <span className={`absolute inset-y-0 left-0 bg-[#8b3a31] transition-[width] ${holding || deleted ? "w-full duration-[1600ms]" : "w-0 duration-150"}`} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";

const ProspectCreateForm = dynamic(() => import("./ProspectCreateForm"), {
  ssr: false,
  loading: () => <div aria-busy="true" className="space-y-3"><div className="h-11 animate-pulse rounded-xl bg-black/10" /><div className="h-11 animate-pulse rounded-xl bg-black/10" /><div className="h-24 animate-pulse rounded-xl bg-black/10" /></div>,
});

export default function ProspectCreateDialog() {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialogEscape(open, () => setOpen(false));

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2">
        <FiPlus aria-hidden="true" />
        Add prospect
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-3 sm:p-6">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prospect-create-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="prospect-create-title" className="text-xl font-semibold tracking-[-0.03em]">Add a prospect</h2>
                <p className="mt-1 text-sm text-black/60">Save a business to review or contact later.</p>
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Close dialog" onClick={() => setOpen(false)}>
                <FiX aria-hidden="true" />
              </Button>
            </div>
            <ProspectCreateForm onCreated={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

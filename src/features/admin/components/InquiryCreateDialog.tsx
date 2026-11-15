"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { IoCloseSharp } from "react-icons/io5";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";

const InquiryCreateForm = dynamic(() => import("./InquiryCreateForm"), {
  ssr: false,
  loading: () => <div aria-busy="true" aria-label="Loading form" className="h-64 animate-pulse rounded-xl bg-black/5 motion-reduce:animate-none" />,
});

export default function InquiryCreateDialog() {
  const [open, setOpen] = useState(false);
  const dialogRef = useDialogEscape(open, () => setOpen(false));
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}><FiPlus aria-hidden="true" />Create inquiry</Button>
      {open && (
        <div ref={dialogRef} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3" role="dialog" aria-modal="true" aria-labelledby="create-inquiry-title">
          <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl sm:p-6">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="create-inquiry-title" className="text-xl font-semibold">Create inquiry</h2>
                <p className="mt-1 text-sm text-black/55">Record an inquiry received outside the website form.</p>
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Close dialog" onClick={() => setOpen(false)}><IoCloseSharp aria-hidden="true" /></Button>
            </header>
            <InquiryCreateForm onCreated={() => setOpen(false)} />
          </section>
        </div>
      )}
    </>
  );
}

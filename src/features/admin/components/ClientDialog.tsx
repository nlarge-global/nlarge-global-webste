"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "./ui/Button";

const ClientForm = dynamic(() => import("./ClientForm"), { ssr: false });

type Client = {
  _id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  notes?: string;
  tags: string[];
};

export default function ClientDialog({ client }: { client?: Client }) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  function close() {
    if (dirty && !window.confirm("Discard the client details you entered?"))
      return;
    setOpen(false);
    setDirty(false);
  }
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        {client ? "Edit details" : "Add client"}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-dialog-title"
          onMouseDown={(event) =>
            event.target === event.currentTarget && close()
          }
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl ">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="client-dialog-title" className="text-xl font-semibold">
                {client ? "Edit client details" : "Add client"}
              </h2>
              <Button
                type="button"
                onClick={close}
                variant="outline"
              >
                Close
              </Button>
            </div>
            <ClientForm client={client} onDirty={() => setDirty(true)} />
          </div>
        </div>
      )}
    </>
  );
}

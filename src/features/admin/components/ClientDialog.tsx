"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "./ui/Button";
import DialogDraft from "./DialogDraft";
import { FiEdit3 } from "react-icons/fi";
import DeleteRowAction from "./DeleteRowAction";

const ClientForm = dynamic(() => import("./ClientForm"), { ssr: false, loading: () => <DialogSkeleton /> });

function DialogSkeleton() {
  return <div aria-label="Loading form" className="space-y-3" aria-busy="true"><div className="h-11 animate-pulse rounded-xl bg-black/10" /><div className="h-11 animate-pulse rounded-xl bg-black/10" /><div className="h-24 animate-pulse rounded-xl bg-black/10" /></div>;
}

type Client = {
  _id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  notes?: string;
  tags: string[];
};

export default function ClientDialog({ client, redirectTo }: { client?: Client; redirectTo?: string }) {
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
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => setOpen(true)} size={client ? "icon" : "default"} aria-label={client ? "Edit client" : undefined}>
          {client ? <FiEdit3 aria-hidden="true" /> : "Add client"}
        </Button>
        {client && <DeleteRowAction endpoint={`/api/admin/clients/${client._id}`} redirectTo={redirectTo} label={`Delete ${client.name}`} description="Archive this client and all of its projects, tasks, secrets, documents, payments, and linked inquiries." />}
      </div>
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
            <DialogDraft storageKey={`admin-client-${client?._id ?? "new"}`}><ClientForm client={client} onDirty={() => setDirty(true)} /></DialogDraft>
          </div>
        </div>
      )}
    </>
  );
}

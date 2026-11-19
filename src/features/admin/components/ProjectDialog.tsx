"use client";

import dynamic from "next/dynamic";
import { useId, useState, type ReactNode } from "react";
import { Button } from "./ui/Button";
import DialogDraft from "./DialogDraft";
import { FiEdit3, FiX } from "react-icons/fi";
import { useDialogEscape } from "./useDialogEscape";

const ProjectForm = dynamic(() => import("./ProjectForm"), {
  ssr: false,
  loading: () => (
    <div aria-label="Loading form" aria-busy="true" className="space-y-3">
      <div className="h-11 animate-pulse rounded-xl bg-black/10" />
      <div className="h-11 animate-pulse rounded-xl bg-black/10" />
      <div className="h-28 animate-pulse rounded-xl bg-black/10" />
    </div>
  ),
});

type Project = {
  _id?: string;
  clientId: string;
  name: string;
  status?: "todo" | "in-progress" | "done";
  technicalDetails?: string;
  deliveryDetails?: string;
  repositoryUrl?: string;
  environment?: string;
  productionUrl?: string;
  stagingUrl?: string;
  deadline?: string;
  deliveredAt?: string;
  notes?: string;
};

export default function ProjectDialog({
  clients,
  project,
  label = "Add project",
  open: controlledOpen,
  onOpenChange,
  trigger,
}: {
  clients: Array<{ _id: string; name: string }>;
  project?: Project;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dialogId = useId();
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const storageKey = `admin-project-${project?._id ?? "new"}`;
  const close = () => {
    if (dirty && !window.confirm("Discard these project changes?")) return;
    setOpen(false);
    setDirty(false);
  };
  const saved = () => {
    sessionStorage.removeItem(storageKey);
    setOpen(false);
    setDirty(false);
  };
  const dialogRef = useDialogEscape(open, close);
  return (
    <>
      {trigger === undefined ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          size={project ? "icon" : "sm"}
          aria-label={project ? "Edit project" : undefined}
          title={project ? "Edit project" : undefined}
        >
          {project ? <FiEdit3 aria-hidden="true" /> : label}
        </Button>
      ) : trigger}
      {open && (
        <div
          ref={dialogRef}
          onClick={(event) => event.stopPropagation()}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id={`${dialogId}-title`} className="text-xl font-semibold">
                {project ? "Edit project" : "Add project"}
              </h2>
              <Button
                type="button"
                onClick={close}
                variant="destructive"
                size="icon"
                title="Close project dialog"
                aria-label="Close project dialog"
              >
                <FiX aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDraft storageKey={storageKey}>
              <ProjectForm
                clients={clients}
                project={project}
                onDirtyChange={setDirty}
                onSaved={saved}
              />
            </DialogDraft>
          </div>
        </div>
      )}
    </>
  );
}

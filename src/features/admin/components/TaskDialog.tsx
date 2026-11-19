"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/Button";
import DialogDraft from "./DialogDraft";
import { IoCloseSharp } from "react-icons/io5";
import type { TaskRecord } from "./TaskForm";
import { useDialogEscape } from "./useDialogEscape";

const TaskForm = dynamic(() => import("./TaskForm"), {
  ssr: false,
  loading: () => (
    <div aria-label="Loading form" aria-busy="true" className="space-y-3">
      <div className="h-11 animate-pulse rounded-xl bg-black/10" />
      <div className="h-11 animate-pulse rounded-xl bg-black/10" />
      <div className="h-24 animate-pulse rounded-xl bg-black/10" />
    </div>
  ),
});

export default function TaskDialog({
  projectId,
  onOptimisticCreate,
  onCreated,
  onCreateFailed,
}: {
  projectId: string;
  onOptimisticCreate: (task: TaskRecord) => void;
  onCreated: (temporaryId: string, task: TaskRecord) => void;
  onCreateFailed: (temporaryId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const dialogRef = useDialogEscape(open, () => setOpen(false));
  return (
    <>
      <Button type="button" onClick={() => { setMounted(true); setOpen(true); }} size="sm">
        Add task
      </Button>
      {mounted && (
        <div
          ref={dialogRef}
          className={`fixed inset-0 z-50 place-items-center bg-black/40 p-2 ${open ? "grid" : "hidden"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-dialog-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="">
                <h2 id="task-dialog-title" className="text-xl font-semibold">
                Add task
              </h2>
              <p className="-mt-1 text-sm text-black/50">
                Create a reminder for yourself
              </p>
              </div>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                variant="destructive"
                aria-label="Close client dialog"
              >
                <IoCloseSharp aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDraft storageKey={`admin-task-${projectId}`}>
              <TaskForm
                projectId={projectId}
                onOptimisticCreate={onOptimisticCreate}
                onCreateFailed={onCreateFailed}
                onOptimisticClose={() => setOpen(false)}
                onRecover={() => setOpen(true)}
                onCreated={(temporaryId, task) => {
                  sessionStorage.removeItem(`admin-task-${projectId}`);
                  onCreated(temporaryId, task);
                  setOpen(false);
                  setMounted(false);
                  router.refresh();
                }}
              />
            </DialogDraft>
          </div>
        </div>
      )}
    </>
  );
}

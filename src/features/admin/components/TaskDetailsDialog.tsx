"use client";

import { FiX } from "react-icons/fi";
import type { TaskRecord } from "./TaskForm";
import { Button } from "./ui/Button";
import { useDialogEscape } from "./useDialogEscape";
import RecordBadge from "./RecordBadge";

export default function TaskDetailsDialog({
  task,
  loading = false,
  onClose,
}: {
  task: TaskRecord;
  loading?: boolean;
  onClose: () => void;
}) {
  const dialogRef = useDialogEscape(true, onClose);

  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`task-details-${task._id}`}
      aria-describedby={loading ? undefined : `task-notes-${task._id}`}
      aria-busy={loading}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={`task-details-${task._id}`}
              className="break-words text-xl font-semibold"
            >
              {task.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <RecordBadge status={task.status} />
              <RecordBadge
                status={task.priority}
                label={`${task.priority} priority`}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close task details"
            title="Close task details"
            autoFocus
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <FiX aria-hidden="true" />
          </Button>
        </header>

        {loading ? (
          <div className="mt-5 space-y-3" role="status">
            <span className="sr-only">Loading task details</span>
            <div className="h-16 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            <div className="h-12 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Notes</h3>
              <p
                id={`task-notes-${task._id}`}
                className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-black/75"
              >
                {task.notes?.trim() || "No notes added."}
              </p>
            </div>
            <dl className="mt-6 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-2">
              <TaskTimestamp label="Created" value={task.createdAt} />
              <TaskTimestamp label="Last updated" value={task.updatedAt} />
              <TaskTimestamp
                label="Done at"
                value={task.status === "done" ? task.completedAt : null}
                emptyText={
                  task.status === "done" ? "Date not recorded" : "Not completed"
                }
              />
              <TaskTimestamp label="Due date" value={task.dueDate} />
            </dl>
          </>
        )}
      </section>
    </div>
  );
}

function TaskTimestamp({
  label,
  value,
  emptyText,
}: {
  label: string;
  value?: string | null;
  emptyText?: string;
}) {
  const date = value ? new Date(value) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;

  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-black/50">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-black/80">
        {validDate ? (
          <time dateTime={validDate.toISOString()}>
            {validDate.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        ) : (
          <span className="text-black/45">
            {emptyText ?? (label === "Due date" ? "No due date" : "Unavailable")}
          </span>
        )}
      </dd>
    </div>
  );
}

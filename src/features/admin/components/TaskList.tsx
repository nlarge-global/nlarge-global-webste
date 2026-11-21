"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getDueDateState,
} from "@/features/admin/services/due-date-state";
import { formatDateTime } from "@/features/admin/services/date-time";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import TaskDialog from "./TaskDialog";
import RecordActionsMenu from "./RecordActionsMenu";
import TaskForm, { type TaskFormValues, type TaskRecord } from "./TaskForm";
import { useDialogEscape } from "./useDialogEscape";
import RecordBadge from "./RecordBadge";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";
import {
  deleteAdminRecord,
  restoreAdminRecord,
  waitForDeleteFeedback,
  type DeleteMode,
} from "./admin-delete";
import type { ArchiveFilter } from "@/features/admin/services/archive-filter";

type Task = TaskRecord;
type TaskChanges = TaskFormValues;
type TaskAction = "edit" | "delete" | "details" | null;

const TaskDetailsDialog = dynamic(() => import("./TaskDetailsDialog"), {
  ssr: false,
  loading: () => (
    <div
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label="Loading task details"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg space-y-3 rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
        <div className="h-6 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="h-20 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="h-12 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      </div>
    </div>
  ),
});

export default function TaskList({
  projectId,
  initialTasks,
  archive,
}: {
  projectId: string;
  initialTasks: Task[];
  archive: ArchiveFilter;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const updateTask = useCallback((taskId: string, changes: Partial<Task>) => {
    setTasks((current) =>
      current.map((task) =>
        task._id === taskId
          ? {
              ...task,
              ...changes,
              ...(changes.notes !== undefined
                ? {
                    notesPreview: changes.notes
                      ?.replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 120),
                  notes: undefined,
                }
              : {}),
            }
          : task,
      ),
    );
  }, []);

  async function saveTask(
    taskId: string,
    changes: TaskChanges,
    onRecover?: () => void,
  ) {
    const previous = tasks.find((task) => task._id === taskId);
    if (!previous) {
      const message = "This task is no longer available. Refresh and try again.";
      if (onRecover) showOptimisticRecoveryToast(message, onRecover);
      else toast.error(message);
      return null;
    }
    updateTask(taskId, {
      ...changes,
      ...(changes.status === "done" && previous.status !== "done"
        ? { completedAt: new Date().toISOString() }
        : changes.status && changes.status !== "done"
          ? { completedAt: null }
          : {}),
      ...(changes.notes !== undefined
        ? {
            notesPreview: changes.notes
              ?.replace(/\s+/g, " ")
              .trim()
              .slice(0, 120),
          }
        : {}),
    });
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
        body: JSON.stringify({ taskId, ...changes }),
      });
      const result = (await response.json()) as {
        error?: string;
        task?: Task;
      };
      if (!response.ok || !result.task) {
        throw new Error(result.error ?? "Unable to update task.");
      }
      updateTask(taskId, result.task);
      toast.success("Task updated.");
      return null;
    } catch (error) {
      updateTask(taskId, previous);
      const message = getDisplayErrorMessage(error, "Unable to update task.");
      if (onRecover) {
        showOptimisticRecoveryToast(message, onRecover);
        return null;
      }
      toast.error(message);
      return message;
    }
  }

  const deleteTask = useCallback(
    async (taskId: string, mode: DeleteMode) => {
      const startedAt = Date.now();
      setPendingDeletes((current) => new Set(current).add(taskId));
      try {
        await deleteAdminRecord(
          `/api/admin/tasks?taskId=${taskId}`,
          taskId,
          mode,
          "Unable to delete task.",
        );
        await waitForDeleteFeedback(startedAt);
        setTasks((current) => current.filter((task) => task._id !== taskId));
        toast.success(mode === "permanent" ? "Task permanently deleted." : "Task archived.");
      } catch (error) {
        setPendingDeletes((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
        const message = getDisplayErrorMessage(error, "Unable to delete task.");
        throw new Error(message);
      } finally {
        setPendingDeletes((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
      }
    },
    [],
  );

  const restoreTask = useCallback(
    async (taskId: string) => {
      try {
        await restoreAdminRecord(
          `/api/admin/tasks?taskId=${taskId}`,
          taskId,
          "Unable to restore task.",
        );
        setTasks((current) =>
          archive === "archived"
            ? current.filter((task) => task._id !== taskId)
            : current.map((task) =>
                task._id === taskId
                  ? { ...task, deletedAt: undefined }
                  : task,
              ),
        );
        toast.success("Task restored.");
      } catch (error) {
        toast.error(getDisplayErrorMessage(error, "Unable to restore task."));
      }
    },
    [archive],
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Tasks</h2>
        <TaskDialog
          projectId={projectId}
          onOptimisticCreate={(task) =>
            setTasks((current) => [task, ...current])
          }
          onCreated={(temporaryId, task) =>
            setTasks((current) =>
              current.map((item) => (item._id === temporaryId ? task : item)),
            )
          }
          onCreateFailed={(temporaryId) =>
            setTasks((current) =>
              current.filter((task) => task._id !== temporaryId),
            )
          }
        />
      </div>
      <div className="grid gap-3">
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-sm text-black/55">
            No tasks yet. Add one to keep track of the next step.
          </p>
        )}
        {tasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            hidden={pendingDeletes.has(task._id)}
            onSave={saveTask}
            onDelete={(mode) => deleteTask(task._id, mode)}
            onRestore={() => restoreTask(task._id)}
          />
        ))}
      </div>
    </section>
  );
}

function TaskItem({
  task,
  hidden,
  onSave,
  onDelete,
  onRestore,
}: {
  task: Task;
  hidden: boolean;
  onSave: (
    taskId: string,
    changes: TaskChanges,
    onRecover?: () => void,
  ) => Promise<string | null>;
  onDelete: (mode: DeleteMode) => Promise<void>;
  onRestore: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<TaskAction>(null);
  const [dialogTask, setDialogTask] = useState<Task | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const notes = task.notesPreview ?? task.notes?.replace(/\s+/g, " ").trim();
  const hasMoreNotes = Boolean(notes && notes.length >= 120);
  const dueState = task.status === "done" ? null : getDueDateState(task.dueDate);
  const cardStyle =
    dueState === "overdue"
      ? "border-[#b85c52]/40 bg-[#fff6f4]"
      : dueState === "today"
        ? "border-[#d9aaa5] bg-[#fff9f8]"
        : dueState === "soon"
          ? "border-[#e3c9c5] bg-[#fdf9f8]"
          : "border-black/10 bg-white";

  async function loadFullTask() {
    const response = await fetch(`/api/admin/tasks?taskId=${task._id}`);
    const result = (await response.json()) as {
      task?: Task;
      error?: string;
    };
    if (!response.ok || !result.task) {
      throw new Error(result.error ?? "Unable to load task details.");
    }
    return result.task;
  }

  async function openDialog(nextAction: "edit" | "details") {
    setDialogTask(task);
    setAction(nextAction);
    setDetailsLoading(true);
    try {
      setDialogTask(await loadFullTask());
    } catch (reason) {
      setAction(null);
      toast.error(
          getDisplayErrorMessage(reason, "Unable to load task details."),
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <article
      hidden={hidden}
      className={`rounded-xl border p-4 transition-colors ${cardStyle}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-medium text-[#352c29]">
            {task.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RecordBadge status={task.status} />
            <RecordBadge
              status={task.priority}
              label={`${task.priority} priority`}
            />
            {task.status === "done" ? (
              <RecordBadge
                status="due-done"
                label={
                  <>
                    Done at{" "}
                    {task.completedAt ? (
                      <time dateTime={task.completedAt}>
                        {formatDateTime(task.completedAt)}
                      </time>
                    ) : (
                      "date not recorded"
                    )}
                  </>
                }
              />
            ) : task.dueDate ? (
              <RecordBadge
                status={
                  dueState === "overdue"
                    ? "due-overdue"
                    : dueState === "today" || dueState === "soon"
                      ? "due-soon"
                      : "due-later"
                }
                label={
                  <time dateTime={task.dueDate}>
                    Due {formatDateTime(task.dueDate)}
                  </time>
                }
              />
            ) : (
              <span className="text-xs text-black/55">No due date</span>
            )}
            {dueState && task.status !== "done" && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    dueState === "overdue"
                      ? "font-semibold text-[#a12f26]"
                      : dueState === "today"
                        ? "font-semibold text-[#a94e46]"
                        : "font-medium text-[#9b625c]"
                  }
                >
                  {dueState === "overdue"
                    ? "Invalid date - fix it"
                    : dueState === "today"
                      ? "Due today"
                      : "Due soon"}
                </span>
              </>
            )}
            {task._id.startsWith("optimistic-") && <span>· Saving...</span>}
          </div>
          {notes && (
            <div className="mt-2 max-w-3xl text-sm leading-6 text-black/70">
              <p
                className={
                  expanded && expandedNotes !== null
                    ? "whitespace-pre-wrap break-words"
                    : "truncate"
                }
              >
                {expanded && expandedNotes !== null
                  ? expandedNotes
                  : `${notes}${hasMoreNotes ? "..." : ""}`}
              </p>
              {(hasMoreNotes || expandedNotes !== null) && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  disabled={notesLoading}
                  onClick={async (event) => {
                    event.stopPropagation();
                    if (expanded) {
                      setExpanded(false);
                      return;
                    }
                    setNotesLoading(true);
                    try {
                      const fullTask = await loadFullTask();
                      setExpandedNotes(fullTask.notes ?? "");
                      setExpanded(true);
                    } catch (reason) {
                      toast.error(
                        getDisplayErrorMessage(reason, "Unable to load task notes."),
                      );
                    } finally {
                      setNotesLoading(false);
                    }
                  }}
                  title={expanded ? "Collapse task notes" : "Read full task notes"}
                  className="mt-1 text-xs text-black/50 underline decoration-black/25 underline-offset-2 hover:text-black/75 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                >
                  {notesLoading ? "Loading..." : expanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          )}
        </div>
        {!task._id.startsWith("optimistic-") && (
          <RecordActionsMenu
            label={`task ${task.title}`}
            edit={{ onSelect: () => void openDialog("edit") }}
            details={{ onSelect: () => void openDialog("details") }}
            detailsLabel="Details"
            restore={
              task.deletedAt
                ? { onSelect: () => void onRestore() }
                : undefined
            }
            delete={{ onSelect: () => setAction("delete") }}
          />
        )}
      </div>
      {action === "edit" && (
        detailsLoading ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-busy="true"
            aria-label="Loading task for editing"
            className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
          >
            <div className="w-full max-w-lg space-y-3 rounded-2xl bg-[#fffdfb] p-5 shadow-2xl">
              <div className="h-6 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-20 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            </div>
          </div>
        ) : dialogTask ? (
          <TaskEditDialog
            task={dialogTask}
            onSave={onSave}
            onClose={() => setAction(null)}
            onDraftChange={(changes) =>
              setDialogTask((current) => current ? { ...current, ...changes } : current)
            }
            onRecover={() => setAction("edit")}
          />
        ) : null
      )}
      {action === "delete" && (
        <DeleteConfirmationDialog
          label={`Delete ${task.title}`}
          description="Archive this task from the project."
          onConfirm={onDelete}
          modeOptions={task.deletedAt ? "permanent-only" : "soft-and-permanent"}
          onRecovery={() => setAction("delete")}
          open
          onOpenChange={(open) => {
            if (!open) setAction(null);
          }}
          trigger={null}
        />
      )}
      {action === "details" && (
        <TaskDetailsDialog
          task={dialogTask ?? task}
          loading={detailsLoading}
          onClose={() => setAction(null)}
        />
      )}
    </article>
  );
}

function TaskEditDialog({
  task,
  onSave,
  onClose,
  onDraftChange,
  onRecover,
}: {
  task: Task;
  onSave: (
    taskId: string,
    changes: TaskChanges,
    onRecover?: () => void,
  ) => Promise<string | null>;
  onClose: () => void;
  onDraftChange: (changes: TaskChanges) => void;
  onRecover: () => void;
}) {
  const [pending, setPending] = useState(false);
  const dialogRef = useDialogEscape(true, onClose, pending);

  return (
    <div
      ref={dialogRef}
      onClick={(event) => event.stopPropagation()}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`edit-task-${task._id}`}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
      >
        <h2 id={`edit-task-${task._id}`} className="text-xl font-semibold">
          Edit task
        </h2>
        <TaskForm
          task={task}
          onSave={onSave}
          onClose={onClose}
          onDraftChange={onDraftChange}
          onRecover={onRecover}
          onPendingChange={setPending}
        />
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiEdit3 } from "react-icons/fi";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import TaskDialog from "./TaskDialog";
import TaskStatusSelect from "./TaskStatusSelect";
import { Button } from "./ui/Button";
import type { TaskRecord } from "./TaskForm";

type Task = TaskRecord;
type TaskChanges = Pick<Task, "title" | "priority"> & {
  dueDate?: string | null;
};

export default function TaskList({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const updateTask = useCallback((taskId: string, changes: Partial<Task>) => {
    setTasks((current) =>
      current.map((task) =>
        task._id === taskId ? { ...task, ...changes } : task,
      ),
    );
  }, []);

  async function saveTask(taskId: string, changes: TaskChanges) {
    const previous = tasks.find((task) => task._id === taskId);
    if (!previous)
      return "This task is no longer available. Refresh and try again.";
    updateTask(taskId, changes);
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
      router.refresh();
      return null;
    } catch (error) {
      updateTask(taskId, previous);
      return error instanceof Error ? error.message : "Unable to update task.";
    }
  }

  const deleteTask = useCallback(
    async (taskId: string) => {
      setPendingDeletes((current) => new Set(current).add(taskId));
      try {
        const csrfToken = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
          ?.split("=")[1];
        const response = await fetch(`/api/admin/tasks?taskId=${taskId}`, {
          method: "DELETE",
          headers: {
            "x-confirm-delete": taskId,
            ...(csrfToken
              ? { "x-csrf-token": decodeURIComponent(csrfToken) }
              : {}),
          },
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok)
          throw new Error(result.error ?? "Unable to archive task.");
        setTasks((current) => current.filter((task) => task._id !== taskId));
        router.refresh();
      } catch (error) {
        setPendingDeletes((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
        throw error;
      } finally {
        setPendingDeletes((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
      }
    },
    [router],
  );

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5">
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
      <div className="mt-4 divide-y divide-black/10">
        {tasks.length === 0 && (
          <p className="py-5 text-sm text-black/50">No tasks yet.</p>
        )}
        {tasks.map((task) => (
          <div
            key={task._id}
            hidden={pendingDeletes.has(task._id)}
            className="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{task.title}</p>
              <p className="mt-1 text-xs capitalize text-black/50">
                {task.status} · {task.priority}
                {task.dueDate
                  ? ` · due ${new Date(task.dueDate).toLocaleDateString()}`
                  : ""}
                {task._id.startsWith("optimistic-") ? " · Saving..." : ""}
              </p>
            </div>
            {!task._id.startsWith("optimistic-") && (
              <div className="flex items-center gap-2">
                <TaskStatusSelect
                  taskId={task._id}
                  status={task.status}
                  onOptimisticChange={(status) =>
                    void updateTask(task._id, { status })
                  }
                />
                <TaskEditDialog task={task} onSave={saveTask} />
                <DeleteConfirmationDialog
                  label={`Delete ${task.title}`}
                  description="Archive this task from the project."
                  onConfirm={() => deleteTask(task._id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskEditDialog({
  task,
  onSave,
}: {
  task: Task;
  onSave: (taskId: string, changes: TaskChanges) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const changes: TaskChanges = {
      title: String(form.get("title")).trim(),
      priority: String(form.get("priority")) as Task["priority"],
      dueDate: form.get("dueDate") ? String(form.get("dueDate")) : null,
    };
    setPending(true);
    setError("");
    const result = await onSave(task._id, changes);
    if (result) setError(result);
    else setOpen(false);
    setPending(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Edit ${task.title}`}
        onClick={() => setOpen(true)}
      >
        <FiEdit3 aria-hidden="true" />
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-task-${task._id}`}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"
          >
            <h2 id={`edit-task-${task._id}`} className="text-xl font-semibold">
              Edit task
            </h2>
            <input
              name="title"
              required
              defaultValue={task.title}
              className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3"
            />
            <select
              name="priority"
              defaultValue={task.priority}
              className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <input
              name="dueDate"
              type="date"
              defaultValue={task.dueDate?.slice(0, 10)}
              className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-[#602329]">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

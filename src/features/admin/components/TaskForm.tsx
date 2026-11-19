"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { showOptimisticRecoveryToast } from "./showOptimisticRecoveryToast";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";
import { fromDateTimeLocal, toDateTimeLocal } from "@/features/admin/services/date-time";

export type TaskRecord = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "normal" | "high";
  dueDate?: string | null;
  notes?: string | null;
  notesPreview?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
};

export type TaskFormValues = Pick<
  TaskRecord,
  "title" | "status" | "priority" | "notes"
> & { dueDate: string | null };

type CreateTaskFormProps = {
  projectId: string;
  onOptimisticCreate: (task: TaskRecord) => void;
  onCreated: (temporaryId: string, task: TaskRecord) => void;
  onCreateFailed: (temporaryId: string) => void;
  onOptimisticClose: () => void;
  onRecover: () => void;
};

type EditTaskFormProps = {
  task: TaskRecord;
  onSave: (
    taskId: string,
    changes: TaskFormValues,
    onRecover?: () => void,
  ) => Promise<string | null>;
  onClose: () => void;
  onDraftChange?: (changes: TaskFormValues) => void;
  onRecover?: () => void;
  onPendingChange?: (pending: boolean) => void;
};

export default function TaskForm(props: CreateTaskFormProps | EditTaskFormProps) {
  const task = "task" in props ? props.task : undefined;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const values: TaskFormValues = {
      title: String(form.get("title")).trim(),
      status: String(form.get("status") ?? task?.status ?? "todo") as TaskRecord["status"],
      priority: String(form.get("priority")) as TaskRecord["priority"],
      dueDate: fromDateTimeLocal(form.get("dueDate")),
      notes: String(form.get("notes") ?? "").trim(),
    };
    setPending(true);
    setError("");

    if (task && "onSave" in props) {
      props.onPendingChange?.(true);
      props.onDraftChange?.(values);
      props.onClose();
      try {
        const result = await props.onSave(task._id, values, props.onRecover);
        if (result) setError(result);
      } finally {
        props.onPendingChange?.(false);
        setPending(false);
      }
      return;
    }

    if (!("projectId" in props)) return;
    const temporaryId = `optimistic-${crypto.randomUUID()}`;
    props.onOptimisticCreate({
      _id: temporaryId,
      ...values,
      status: "todo",
    });
    props.onOptimisticClose();
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken
            ? { "x-csrf-token": decodeURIComponent(csrfToken) }
            : {}),
        },
        body: JSON.stringify({
          projectId: props.projectId,
          ...values,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        task?: TaskRecord;
      };
      if (!response.ok || !result.task) {
        props.onCreateFailed(temporaryId);
        const message = result.error ?? "Unable to create task.";
        showOptimisticRecoveryToast(message, props.onRecover);
      } else {
        formElement.reset();
        props.onCreated(temporaryId, result.task);
        toast.success("Task added.");
      }
    } catch (reason) {
      props.onCreateFailed(temporaryId);
      const message = getDisplayErrorMessage(
        reason,
        "Unable to create task. Please try again.",
      );
      showOptimisticRecoveryToast(message, props.onRecover);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="">
      <label className="mt-4 block text-sm font-medium">
        Title
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={task?.title}
          autoFocus={Boolean(task)}
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      {task && (
        <label className="mt-3 block text-sm font-medium">
          Status
          <Select name="status" defaultValue={task.status} className="mt-2">
            <option value="todo">Todo</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </label>
      )}
      <div className="mt-4 grid items-end gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Due date and time
          <input
            name="dueDate"
            type="datetime-local"
            step="60"
            defaultValue={toDateTimeLocal(task?.dueDate)}
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Priority
          <Select
            name="priority"
            defaultValue={task?.priority ?? "normal"}
            className="mt-2"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium">
        Notes
        <textarea
          name="notes"
          maxLength={3000}
          rows={3}
          defaultValue={task?.notes ?? ""}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#602329]">
          {error}
        </p>
      )}
      <div className="my-2 flex justify-end gap-2">
        {task && "onClose" in props && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            title="Cancel editing"
            onClick={(event) => {
              event.stopPropagation();
              props.onClose();
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending} className={task ? "" : "w-full"}>
          {pending ? (task ? "Saving..." : "Adding...") : task ? "Save changes" : "Add task"}
        </Button>
      </div>
    </form>
  );
}

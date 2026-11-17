"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "@/components/ui/select";

export type TaskRecord = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: string;
  dueDate?: string | null;
};

export default function TaskForm({
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
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setError("");
    const form = new FormData(formElement);
    const temporaryId = `optimistic-${crypto.randomUUID()}`;
    onOptimisticCreate({
      _id: temporaryId,
      title: String(form.get("title")).trim(),
      status: "todo",
      priority: String(form.get("priority")),
      dueDate: form.get("dueDate") ? String(form.get("dueDate")) : undefined,
    });
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
          projectId,
          title: form.get("title"),
          dueDate: form.get("dueDate") || undefined,
          priority: form.get("priority"),
          notes: form.get("notes"),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        task?: TaskRecord;
      };
      if (!response.ok || !result.task) {
        onCreateFailed(temporaryId);
        setError(result.error ?? "Unable to create task.");
      } else {
        formElement.reset();
        onCreated(temporaryId, result.task);
      }
    } catch (error) {
      onCreateFailed(temporaryId);
      setError(getDisplayErrorMessage(error, "Unable to create task. Please try again."));
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
          className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Due date
          <input
            name="dueDate"
            type="date"
            className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Priority
          <Select name="priority" defaultValue="normal">
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
          rows={3}
          className="mt-2 w-full rounded-xl border border-black/15 p-3"
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#602329]">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="my-2 w-full">
        {pending ? "Adding..." : "Add task"}
      </Button>
    </form>
  );
}

"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

export default function TaskStatusSelect({
  taskId,
  status,
  onOptimisticChange,
  ariaLabel = "Task status",
}: {
  taskId: string;
  status: "todo" | "in-progress" | "done";
  onOptimisticChange?: (status: "todo" | "in-progress" | "done") => void;
  ariaLabel?: string;
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => setValue(status), [status]);

  async function update(next: string) {
    const previous = value;
    const nextStatus = next as typeof value;
    setError("");
    setValue(nextStatus);
    onOptimisticChange?.(nextStatus);
    setPending(true);
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update task status.");
      router.refresh();
    } catch (error) {
      setValue(previous);
      onOptimisticChange?.(previous);
      setError(getDisplayErrorMessage(error, "Unable to update"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onChange={(event) => update(event.target.value)}
        disabled={pending}
        aria-label={ariaLabel}
        className="min-h-10 rounded-lg pr-10"
      >
        <option value="todo">Todo</option>
        <option value="in-progress">In progress</option>
        <option value="done">Done</option>
      </Select>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";

export default function TaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: "todo" | "in-progress" | "done";
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState("");
  async function update(next: string) {
    setError("");
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
      body: JSON.stringify({ taskId, status: next }),
    });
    if (!response.ok) {
      setError("Unable to update");
      return;
    }
    setValue(next as typeof value);
  }
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onChange={(event) => update(event.target.value)}
        aria-label="Task status"
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

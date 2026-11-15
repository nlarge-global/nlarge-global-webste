"use client";

import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";

export default function TaskForm({ projectId, onCreated }: { projectId: string; onCreated: (task: { _id: string; title: string; status: string; priority: string; dueDate?: string }) => void }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) },
      body: JSON.stringify({ projectId, title: form.get("title"), dueDate: form.get("dueDate") || undefined, priority: form.get("priority"), notes: form.get("notes") }),
    });
    const result = await response.json() as { error?: string; task?: { _id: string; title: string; status: string; priority: string; dueDate?: string } };
    if (!response.ok || !result.task) setError(result.error ?? "Unable to create task.");
    else {
      onCreated(result.task);
      event.currentTarget.reset();
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/10 bg-white p-5">
      <h2 className="font-semibold">Add task</h2>
      <label className="mt-4 block text-sm font-medium">Title<input name="title" required className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Due date<input name="dueDate" type="date" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 px-3" /></label>
        <label className="text-sm font-medium">Priority<select name="priority" defaultValue="normal" className="mt-2 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
      </div>
      <label className="mt-4 block text-sm font-medium">Notes<textarea name="notes" rows={3} className="mt-2 w-full rounded-xl border border-black/15 p-3" /></label>
      {error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}
      <Button type="submit" disabled={pending} className="mt-4 w-full">{pending ? "Adding..." : "Add task"}</Button>
    </form>
  );
}

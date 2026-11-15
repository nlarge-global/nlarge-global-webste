"use client";

import { useState } from "react";
import TaskStatusSelect from "./TaskStatusSelect";
import { Button } from "./ui/Button";
import DeleteRowAction from "./DeleteRowAction";
import { FiEdit3 } from "react-icons/fi";
import { FormEvent } from "react";

type Task = { _id: string; title: string; status: string; priority: string; dueDate?: string };

export default function TaskList({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <div>
      <section className="rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Tasks</h2>
        <div className="mt-4 divide-y divide-black/10">
          {tasks.length === 0 && <p className="py-5 text-sm text-black/50">No tasks yet.</p>}
          {tasks.map((task) => <div key={task._id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium">{task.title}</p><p className="mt-1 text-xs capitalize text-black/50">{task.status} · {task.priority}{task.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString()}` : ""}</p></div><div className="flex items-center gap-2"><TaskStatusSelect taskId={task._id} status={task.status as "todo" | "in-progress" | "done"} /><TaskEditDialog task={task} /><DeleteRowAction endpoint={`/api/admin/tasks?taskId=${task._id}`} label={`Delete ${task.title}`} description="Archive this task from the project." /></div></div>)}
        </div>
      </section>
    </div>
  );
}

function TaskEditDialog({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    const response = await fetch("/api/admin/tasks", { method: "PATCH", headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}) }, body: JSON.stringify({ taskId: task._id, ...Object.fromEntries(new FormData(event.currentTarget).entries()) }) });
    if (response.ok) setOpen(false);
    else { const result = await response.json() as { error?: string }; setError(result.error ?? "Unable to update task."); }
  }
  return <><Button type="button" variant="outline" size="icon" aria-label={`Edit ${task.title}`} onClick={() => setOpen(true)}><FiEdit3 aria-hidden="true" /></Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={`edit-task-${task._id}`}><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><h2 id={`edit-task-${task._id}`} className="text-xl font-semibold">Edit task</h2><input name="title" required defaultValue={task.title} className="mt-4 min-h-11 w-full rounded-xl border border-black/15 px-3" /><select name="priority" defaultValue={task.priority} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select><input name="dueDate" type="date" defaultValue={task.dueDate?.slice(0, 10)} className="mt-3 min-h-11 w-full rounded-xl border border-black/15 px-3" />{error && <p role="alert" className="mt-3 text-sm text-[#602329]">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save changes</Button></div></form></div>}</>;
}

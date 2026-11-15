"use client";

import { useState } from "react";
import TaskStatusSelect from "./TaskStatusSelect";

type Task = { _id: string; title: string; status: string; priority: string; dueDate?: string };

export default function TaskList({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <div>
      <section className="rounded-2xl border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Tasks</h2>
        <div className="mt-4 divide-y divide-black/10">
          {tasks.length === 0 && <p className="py-5 text-sm text-black/50">No tasks yet.</p>}
          {tasks.map((task) => <div key={task._id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium">{task.title}</p><p className="mt-1 text-xs capitalize text-black/50">{task.status} · {task.priority}{task.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString()}` : ""}</p></div><TaskStatusSelect taskId={task._id} status={task.status as "todo" | "in-progress" | "done"} /></div>)}
        </div>
      </section>
    </div>
  );
}

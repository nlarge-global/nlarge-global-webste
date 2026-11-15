"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "./ui/Button";

const TaskForm = dynamic(() => import("./TaskForm"), { ssr: false });

export default function TaskDialog({ projectId, onCreated }: { projectId: string; onCreated: (task: { _id: string; title: string; status: string; priority: string; dueDate?: string }) => void }) {
  const [open, setOpen] = useState(false);
  return <><Button type="button" onClick={() => setOpen(true)} size="sm">Add task</Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="task-dialog-title" className="text-xl font-semibold">Add task</h2><Button type="button" onClick={() => setOpen(false)} variant="outline">Close</Button></div><TaskForm projectId={projectId} onCreated={(task) => { onCreated(task); setOpen(false); }} /></div></div>}</>;
}

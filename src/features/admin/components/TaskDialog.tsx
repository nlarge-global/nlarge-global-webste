"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/Button";
import DialogDraft from "./DialogDraft";

const TaskForm = dynamic(() => import("./TaskForm"), { ssr: false, loading: () => <div aria-label="Loading form" aria-busy="true" className="space-y-3"><div className="h-11 animate-pulse rounded-xl bg-black/10" /><div className="h-11 animate-pulse rounded-xl bg-black/10" /><div className="h-24 animate-pulse rounded-xl bg-black/10" /></div> });

export default function TaskDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return <><Button type="button" onClick={() => setOpen(true)} size="sm">Add task</Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="task-dialog-title" className="text-xl font-semibold">Add task</h2><Button type="button" onClick={() => setOpen(false)} variant="outline">Close</Button></div><DialogDraft storageKey={`admin-task-${projectId}`}><TaskForm projectId={projectId} onCreated={() => { setOpen(false); router.refresh(); }} /></DialogDraft></div></div>}</>;
}

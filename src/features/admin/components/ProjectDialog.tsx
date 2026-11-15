"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "./ui/Button";

const ProjectForm = dynamic(() => import("./ProjectForm"), { ssr: false });

type Project = { _id?: string; clientId: string; name: string; technicalDetails?: string; deliveryDetails?: string; repositoryUrl?: string; environment?: string; productionUrl?: string; stagingUrl?: string; deadline?: string; notes?: string };

export default function ProjectDialog({ clients, project, label = "Add project" }: { clients: Array<{ _id: string; name: string }>; project?: Project; label?: string }) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const close = () => { if (dirty && !window.confirm("Discard these project changes?")) return; setOpen(false); setDirty(false); };
  return <><Button type="button" onClick={() => setOpen(true)} size="sm">{label}</Button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" onMouseDown={(event) => event.target === event.currentTarget && close()}><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#fffdfb] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between gap-4"><h2 id="project-dialog-title" className="text-xl font-semibold">{project ? "Edit project" : "Add project"}</h2><Button type="button" onClick={close} variant="outline">Close</Button></div><div onChange={() => setDirty(true)}><ProjectForm clients={clients} project={project} /></div></div></div>}</>;
}

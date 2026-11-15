"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";

type Status = "new" | "in-progress" | "converted" | "archived";
type Priority = "low" | "normal" | "high";

export default function InquiryProperties({
  inquiryId,
  initialStatus,
  initialPriority,
}: {
  inquiryId: string;
  initialStatus: Status;
  initialPriority: Priority;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function update(field: "status" | "priority", value: Status | Priority) {
    const previous = field === "status" ? status : priority;
    if (field === "status") setStatus(value as Status);
    else setPriority(value as Priority);
    setPending(true);
    setError("");
    const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("nlarge_admin_csrf="))?.split("=")[1];
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({ [field]: value }),
      });
      const result = await response.json() as { error?: string; status?: Status; priority?: Priority };
      if (!response.ok) throw new Error(result.error ?? "Unable to update inquiry.");
      if (result.status) setStatus(result.status);
      if (result.priority) setPriority(result.priority);
    } catch (cause) {
      if (field === "status") setStatus(previous as Status);
      else setPriority(previous as Priority);
      setError(cause instanceof Error ? cause.message : "Unable to update inquiry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 grid gap-4 rounded-xl bg-[#fbfaf8] p-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">Status
        <Select disabled={pending} value={status} onChange={(event) => void update("status", event.target.value as Status)}>
          <option value="new">New</option>
          <option value="in-progress">In progress</option>
          <option value="converted">Converted</option>
          <option value="archived">Archived</option>
        </Select>
        <span className="mt-1 block text-xs font-normal text-black/55">Set manually; linking a client does not change it.</span>
      </label>
      <label className="block text-sm font-medium">Priority
        <Select disabled={pending} value={priority} onChange={(event) => void update("priority", event.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </Select>
        <span className="mt-1 block text-xs font-normal text-black/55">Assigned by an admin. New inquiries default to Normal.</span>
      </label>
      {status === "converted" && (
        <p className="text-xs leading-5 text-black/55 sm:col-span-2">
          Converted is a manual status for inquiries you consider successfully turned into an engagement.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-[#602329] sm:col-span-2">{error}</p>}
    </div>
  );
}
